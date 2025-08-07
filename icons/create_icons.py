from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # 創建圖像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 定義漸層色（紫色主題）
    color1 = (102, 126, 234)  # #667eea
    color2 = (118, 75, 162)   # #764ba2
    
    # 繪製圓角矩形背景
    radius = size // 6
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill=color1,
        outline=None
    )
    
    # 繪製簡單的套件圖示（立方體形狀）
    center_x = size // 2
    center_y = size // 2
    box_size = size // 3
    
    # 使用白色繪製立方體輪廓
    white = (255, 255, 255, 255)
    line_width = max(1, size // 16)
    
    # 前面
    points = [
        (center_x - box_size//2, center_y - box_size//4),
        (center_x - box_size//2, center_y + box_size//2),
        (center_x + box_size//2, center_y + box_size//2),
        (center_x + box_size//2, center_y - box_size//4)
    ]
    draw.polygon(points, outline=white, width=line_width)
    
    # 頂部
    top_points = [
        (center_x - box_size//2, center_y - box_size//4),
        (center_x, center_y - box_size//2),
        (center_x + box_size, center_y - box_size//4),
        (center_x + box_size//2, center_y - box_size//4)
    ]
    draw.polygon(top_points, outline=white, width=line_width)
    
    # 添加 NPM 文字（僅在較大圖示上）
    if size >= 48:
        try:
            # 嘗試使用系統字體
            font_size = size // 8
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            # 使用默認字體
            font = ImageFont.load_default()
        
        text = "NPM"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = (size - text_width) // 2
        text_y = center_y - text_height // 2
        draw.text((text_x, text_y), text, fill=white, font=font)
    
    return img

# 創建所有尺寸的圖示
sizes = [16, 32, 48, 128]

for size in sizes:
    icon = create_icon(size)
    filename = f'icon{size}.png'
    icon.save(filename)
    print(f'Created {filename}')

print("所有圖示已創建完成！")