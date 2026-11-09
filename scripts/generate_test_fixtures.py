"""
VestiAI Test Fixture Generator
Generates clean 768x1024 synthetic benchmark image pairs for automated testing and adapter evaluation.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "api", "tests", "fixtures", "test_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 768, 1024

def generate_person():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(245, 245, 243))
    draw = ImageDraw.Draw(img)
    
    # Head & Hair
    draw.ellipse([314, 120, 454, 280], fill=(225, 195, 175), outline=(190, 160, 140), width=2)
    # Hair
    draw.chord([314, 110, 454, 220], start=180, end=360, fill=(50, 40, 35))
    
    # Neck
    draw.rectangle([354, 270, 414, 340], fill=(215, 185, 165))
    
    # Shoulders and Arms
    # Left arm/shoulder
    draw.polygon([(354, 330), (160, 420), (190, 680), (250, 680), (280, 450), (354, 380)], fill=(215, 185, 165))
    # Right arm/shoulder
    draw.polygon([(414, 330), (608, 420), (578, 680), (518, 680), (488, 450), (414, 380)], fill=(215, 185, 165))
    
    # Torso (Base neutral grey t-shirt)
    draw.polygon([(280, 360), (488, 360), (500, 720), (268, 720)], fill=(210, 212, 215), outline=(180, 182, 185), width=2)
    # Crewneck collar
    draw.arc([340, 330, 428, 380], start=0, end=180, fill=(170, 172, 175), width=4)
    
    # Pants / lower boundary
    draw.rectangle([250, 720, 518, 1024], fill=(45, 52, 64))
    
    output_path = os.path.join(OUTPUT_DIR, "person_01.png")
    img.save(output_path, "PNG")
    print(f"Generated person test fixture: {output_path}")

def generate_garment_01():
    # Navy blue crewneck t-shirt
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # T-shirt body polygon
    # Sleeves + Torso
    points = [
        (300, 260), # Left collar
        (190, 330), # Left shoulder
        (130, 460), # Left sleeve outer
        (210, 500), # Left sleeve under
        (260, 430), # Left armpit
        (260, 780), # Left hem
        (508, 780), # Right hem
        (508, 430), # Right armpit
        (558, 500), # Right sleeve under
        (638, 460), # Right sleeve outer
        (578, 330), # Right shoulder
        (468, 260), # Right collar
    ]
    draw.polygon(points, fill=(24, 43, 73), outline=(15, 28, 50), width=3)
    # Crewneck collar cut
    draw.arc([330, 240, 438, 300], start=0, end=180, fill=(255, 255, 255), width=6)
    
    # VestiAI Brand text / logo printed on shirt
    draw.rectangle([344, 420, 424, 460], fill=(220, 160, 60))
    
    output_path = os.path.join(OUTPUT_DIR, "garment_01.png")
    img.save(output_path, "PNG")
    print(f"Generated garment 01 (Navy T-shirt) test fixture: {output_path}")

def generate_garment_02():
    # Classic White Oxford Shirt
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    points = [
        (310, 250),
        (180, 320),
        (120, 470),
        (200, 510),
        (260, 430),
        (260, 800),
        (508, 800),
        (508, 430),
        (568, 510),
        (648, 470),
        (588, 320),
        (458, 250),
    ]
    draw.polygon(points, fill=(245, 248, 252), outline=(190, 198, 210), width=2)
    # Collar tabs
    draw.polygon([(310, 250), (370, 310), (384, 250)], fill=(235, 240, 248), outline=(180, 190, 205), width=2)
    draw.polygon([(458, 250), (398, 310), (384, 250)], fill=(235, 240, 248), outline=(180, 190, 205), width=2)
    # Placket & buttons
    draw.line([(384, 290), (384, 800)], fill=(200, 210, 225), width=3)
    for y in [340, 410, 480, 550, 620, 690, 760]:
        draw.ellipse([380, y, 388, y+8], fill=(220, 225, 230), outline=(160, 170, 185), width=1)
        
    output_path = os.path.join(OUTPUT_DIR, "garment_02.png")
    img.save(output_path, "PNG")
    print(f"Generated garment 02 (Oxford Shirt) test fixture: {output_path}")

if __name__ == "__main__":
    generate_person()
    generate_garment_01()
    generate_garment_02()
