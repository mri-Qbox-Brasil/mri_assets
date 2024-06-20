import os

# Função para gerar o index.html
def generate_index(directory):
    items = os.listdir(directory)
    output_file = os.path.join(directory, 'index.html')

    OMIT_FILES = ['generate_index.py', 'README.md', '.github', '.git']

    html_content = '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lista de Arquivos</title>
        <!-- Bootstrap CSS -->
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="container mt-5">
            <h1 class="mb-4">Lista de Arquivos e Diretórios</h1>
            <ul class="list-group">
    '''

    for item in items:
        if item not in OMIT_FILES:
            item_path = os.path.join(directory, item)
            if os.path.isfile(item_path):
                html_content += f'<li class="list-group-item"><a href="{item}" download>{item}</a></li>'
            elif os.path.isdir(item_path):
                html_content += f'<li class="list-group-item"><a href="{item}/index.html"><strong>{item}/</strong></a></li>'
                generate_index(item_path)  # Chamada recursiva

    html_content += '''
            </ul>
        </div>
        <!-- Bootstrap JS and dependencies -->
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
