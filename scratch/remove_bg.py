from PIL import Image
import os

input_path = r"C:\Users\asd\..gemini\antigravity\brain\17ab2b79-4648-4664-8eca-336a1c821038\media__1777028808064.png"
# Correcting the path (it was missing a dot or had extra dots in my thought, let's use the absolute one from list_dir)
input_path = r"C:\Users\asd\.gemini\antigravity\brain\17ab2b79-4648-4664-8eca-336a1c821038\media__1777028808064.png"
output_path = r"e:\ustoy\public\favicon.png"

img = Image.open(input_path)
img = img.convert("RGBA")

datas = img.getdata()

newData = []
for item in datas:
    # If the pixel is very light (background), make it transparent
    # The logo is orange, so it has high R but lower G/B.
    # Background in the provided image is light grey/white.
    if item[0] > 200 and item[1] > 200 and item[2] > 200:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)
img.save(output_path, "PNG")
print("Background removed and saved to public/favicon.png")
