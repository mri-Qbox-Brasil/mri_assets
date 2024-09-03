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
                # Não criar link para o diretório atual
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
            <ul class="list-group">
    '''

    for item in items:
        if item not in OMIT_FILES:
            item_path = os.path.join(directory, item)
            if os.path.isfile(item_path):
                html_content += f'<li class="list-group-item"><a href="{item}" download><strong>{item}</strong></a></li>'
            elif os.path.isdir(item_path):
                html_content += f'<li class="list-group-item"><a href="{item}/index.html"><strong>{item}/</strong></a></li>'
                generate_index(item_path, os.path.join(current_path, item))  # Chamada recursiva

    html_content += '''
            </ul>
        </div>
        <!-- Bootstrap JS and dependencies -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/js/all.min.js" integrity="sha512-6sSYJqDreZRZGkJ3b+YfdhB3MzmuP9R7X1QZ6g5aIXhRvR1Y/N/P47jmnkENm7YL3oqsmI6AK+V6AD99uWDnIw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </body>
    </html>
    '''

    with open(output_file, 'w') as f:
        f.write(html_content)

    print(f'Arquivo {output_file} gerado com sucesso!')

# Função principal
def main():
    root_directory = '.'  # Diretório raiz
    generate_index(root_directory)

if __name__ == '__main__':
    main()
