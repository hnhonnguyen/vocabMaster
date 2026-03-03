import numpy as np
from PIL import Image
import struct
import hashlib
import os

def file_to_png(input_file, output_png):
    """Convert any file to PNG image"""
    with open(input_file, 'rb') as f:
        data = f.read()
    
    original_size = len(data)
    size_bytes = struct.pack('<Q', original_size)
    data_with_size = size_bytes + data
    
    arr = np.frombuffer(data_with_size, dtype=np.uint8)
    size = int(np.ceil(np.sqrt(len(arr))))
    padded = np.pad(arr, (0, size*size - len(arr)), mode='constant')
    img_array = padded.reshape(size, size)
    
    img = Image.fromarray(img_array, mode='L')
    img.save(output_png)
    return original_size

def png_to_file(input_png, output_file):
    """Convert PNG image back to original file"""
    img = Image.open(input_png)
    img_array = np.array(img)
    flat_data = img_array.flatten()
    
    size_bytes = flat_data[:8].tobytes()
    original_size = struct.unpack('<Q', size_bytes)[0]
    data = flat_data[8:8+original_size].tobytes()
    
    with open(output_file, 'wb') as f:
        f.write(data)
    return original_size

def get_hash(filename):
    """Get SHA256 hash of file"""
    sha256 = hashlib.sha256()
    with open(filename, 'rb') as f:
        for block in iter(lambda: f.read(4096), b""):
            sha256.update(block)
    return sha256.hexdigest()

# Main execution

os.system("cd /Users/nguyenhuunhon/dev/english/app && tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.vscode' \
    --exclude='tsconfig.tsbuildinfo' \
    --exclude='logs' \
    -czvf vocab-master-transfer.tar.gz .")
    
print("Encoding...")
size = file_to_png('vocab-master-transfer.tar.gz', 'output.png')
print(f"✓ Created output.png ({size} bytes ~ {size / 1024} KB encoded)")

print("\nDecoding...")
restored_size = png_to_file('output.png', 'restored.tar.gz')
print(f"✓ Restored to restored.tar.gz ({restored_size} bytes ~ {restored_size / 1024} KB)")

print("\nVerifying...")
original_hash = get_hash('vocab-master-transfer.tar.gz')
restored_hash = get_hash('restored.tar.gz')

print(f"Original:  {original_hash}")
print(f"Restored:  {restored_hash}")
print(f"\n{'✓ SUCCESS: Files are identical!' if original_hash == restored_hash else '✗ ERROR: Files differ!'}")