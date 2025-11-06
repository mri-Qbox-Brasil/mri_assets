# -*- coding: utf-8 -*-
import os

def generate_index(directory, current_path=''):
    items = os.listdir(directory)
    output_file = os.path.join(directory, 'index.html')

    OMIT_FILES = ['generate_index.py', 'README.md', '.github', '.git', 'index.html', 'CNAME']

    # Construir breadcrumbs
    path_parts = current_path.split(os.sep)
    breadcrumbs = []
    breadcrumb_path = ''

    for i, part in enumerate(path_parts):
        if part:
            breadcrumb_path = os.path.join(breadcrumb_path, part)
            breadcrumbs.append('<li><i class="fa-solid fa-angle-right"></i></li>')
            if i == len(path_parts) - 1:
                breadcrumbs.append(f'<li><strong><span>{part}</span></strong></li>')
            else:
                breadcrumbs.append(f'<li><a href="{breadcrumb_path}/index.html">{part}</a></li>')

    breadcrumbs_html = ''.join(breadcrumbs)

    html_content = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>mri Qbox - Assets</title>
        <!-- Bootstrap CSS -->
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        <!-- Font Awesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <style>
            /* Estilos para o tema escuro */
            body.dark-mode {{
                background-color: #121212;
                color: #ffffff;
            }}
            .dark-mode .list-group-item {{
                background-color: #333333;
                color: #ffffff;
            }}
            .dark-mode .breadcrumb {{
                background-color: #333333;
            }}
            .dark-mode .breadcrumb-item, .dark-mode .breadcrumb-item a {{
                color: #ffffff;
            }}
            .theme-toggle-btn {{
                cursor: pointer;
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
                background: none;
                border: none;
                font-size: 1.5em;
                color: #333;
            }}
            .dark-mode .theme-toggle-btn {{
                color: #ffffff;
            }}

            /* Miniatura das imagens */
            .thumb {{
                width: 48px;
                height: 48px;
                object-fit: cover;
                margin-right: 12px;
                cursor: pointer;
                border-radius: 4px;
                border: 1px solid rgba(0,0,0,0.1);
            }}

            /* Modal de visualização */
            .image-modal {{
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }}
            .image-modal-content {{
                position: relative;
                max-width: 95%;
                max-height: 95%;
            }}
            .image-modal-content img {{
                max-width: 100%;
                max-height: 100%;
                display: block;
                border-radius: 6px;
            }}
            .image-modal .close-btn {{
                position: absolute;
                top: -10px;
                right: -10px;
                background: #fff;
                border: none;
                border-radius: 50%;
                width: 34px;
                height: 34px;
                font-size: 20px;
                line-height: 1;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }}
        </style>
    </head>
    <body>
        <div class="container mt-5">
            <div class="row">
                <img src="https://assets.mriqbox.com.br/branding/logo96.png" alt="mri logo" width="32" height="32" />
                <h1 class="mb-4" style="line-height: 32px; padding-left: 5px;">mri Qbox - Lista de Assets</h1>
            </div>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                        <a href="../index.html"><i class="fas fa-home"></i></a>
                    </li>
                    {breadcrumbs_html}
                </ol>
            </nav>
            <button class="theme-toggle-btn" onclick="toggleTheme()">
                <i id="theme-icon" class="fas fa-moon"></i>
            </button>
            <ul class="list-group">
    '''

    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'}

    for item in items:
        if item not in OMIT_FILES:
            item_path = os.path.join(directory, item)
            if os.path.isfile(item_path):
                _, ext = os.path.splitext(item)
                ext = ext.lower()
                if ext in image_exts:
                    # arquivo de imagem: miniatura clicável + botão de download
                    html_content += (
                        '<li class="list-group-item d-flex align-items-center">'
                        f'<img src="{item}" class="thumb" onclick="openImageModal(\'{item}\')" alt="thumb" />'
                        f'<a href="{item}" download class="mr-3 flex-grow-1"><strong>{item}</strong></a>'
                        f'<a href="{item}" download class="btn btn-sm btn-outline-secondary">Download</a>'
                        '</li>'
                    )
                else:
                    # arquivo não-imagem: link de download simples
                    html_content += (
                        '<li class="list-group-item d-flex align-items-center">'
                        f'<a href="{item}" download class="mr-auto"><strong>{item}</strong></a>'
                        f'<a href="{item}" download class="btn btn-sm btn-outline-secondary">Download</a>'
                        '</li>'
                    )
            elif os.path.isdir(item_path):
                html_content += f'<li class="list-group-item"><a href="{item}/index.html"><strong>{item}/</strong></a></li>'
                generate_index(item_path, os.path.join(current_path, item))

    html_content += '''
            </ul>
        </div>

        <!-- Modal de visualização de imagem -->
        <div id="imageModal" class="image-modal" onclick="onModalClick(event)">
            <div class="image-modal-content" onclick="event.stopPropagation()">
                <button class="close-btn" onclick="closeImageModal()">&times;</button>
                <img id="modalImage" src="" alt="Preview" />
            </div>
        </div>

        <!-- JavaScript para alternar tema e modal -->
        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const theme = localStorage.getItem('theme');
                const themeIcon = document.getElementById('theme-icon');
                if (theme === 'dark') {
                    document.body.classList.add('dark-mode');
                    themeIcon.classList.replace('fa-moon', 'fa-sun');
                }
            });

            function toggleTheme() {
                document.body.classList.toggle('dark-mode');
                const themeIcon = document.getElementById('theme-icon');
                const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
                localStorage.setItem('theme', theme);

                // Alterar ícone
                if (theme === 'dark') {
                    themeIcon.classList.replace('fa-moon', 'fa-sun');
                } else {
                    themeIcon.classList.replace('fa-sun', 'fa-moon');
                }
            }

            // Abre o modal com a imagem passada
            function openImageModal(src) {
                const modal = document.getElementById('imageModal');
                const modalImg = document.getElementById('modalImage');
                modalImg.src = src;
                modal.style.display = 'flex';
            }

            // Fecha o modal
            function closeImageModal() {
                const modal = document.getElementById('imageModal');
                const modalImg = document.getElementById('modalImage');
                modal.style.display = 'none';
                modalImg.src = '';
            }

            // Fecha o modal ao clicar fora do conteúdo
            function onModalClick(e) {
                // se o clique for no overlay, fecha
                if (e.target && e.target.id === 'imageModal') {
                    closeImageModal();
                }
            }
        </script>
        <!-- Bootstrap JS and dependencies -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/js/all.min.js" integrity="sha512-6sSYJqDreZRZGkJ3b+YfdhB3MzmuP9R7X1QZ6g5aIXhRvR1Y/N/P47jmnkENm7YL3oqsmI6AK+V6AD99uWDnIw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </body>
    </html>
    '''

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f'Arquivo {output_file} gerado com sucesso!')

# Função principal
def main():
    root_directory = '.'  # Diretório raiz
    generate_index(root_directory)

if __name__ == '__main__':
    main()
