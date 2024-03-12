def dos2unix(file_path):
    with open(file_path, 'rb') as dos_file:
        content = dos_file.read().replace(b'\r\n', b'\n')
    with open(file_path, 'wb') as unix_file:
        unix_file.write(content)

dos2unix('requirement.sh')
