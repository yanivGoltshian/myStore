import sys
import base64
import os

def create_html():
    # 2. Generate HTML (we will use an existing screenshot if we can't take one, or just let you take it manually, but let's try to just generate the HTML first and open it)
    store_photo_path = '/Users/yaniv/.copilot/attachments/86ff2e7d-22c5-426b-bf07-2f4a8da7c229-797e4a40-7c85-4018-9a8f-4adab76303f4-clipboard.png'
    
    with open(store_photo_path, "rb") as f:
        store_photo_base64 = base64.b64encode(f.read()).decode('utf-8')
        
    html = f"""
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body {{
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      box-sizing: border-box;
    }}
    .container {{
      display: flex;
      gap: 40px;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }}
    .card {{
      background: white;
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }}
    .label {{
      background: #862421;
      color: white;
      padding: 8px 24px;
      border-radius: 20px;
      font-size: 24px;
      font-weight: bold;
      position: absolute;
      top: -20px;
      box-shadow: 0 4px 12px rgba(134,36,33,0.4);
    }}
    .label-new {{
      background: #2b6cb0;
      box-shadow: 0 4px 12px rgba(43,108,176,0.4);
    }}
    .img-container {{
      border-radius: 12px;
      overflow: hidden;
      border: 4px solid #f7fafc;
    }}
    .store-img {{
      width: 400px;
      height: 600px;
      object-fit: cover;
      display: block;
    }}
    .phone-img {{
      width: 300px;
      height: 600px;
      border: none;
      display: block;
      border-radius: 24px;
    }}
    .arrow {{
      font-size: 64px;
      color: white;
      font-weight: bold;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    }}
    .header-text {{
      position: absolute;
      top: 40px;
      width: 100%;
      text-align: center;
      color: white;
      font-size: 48px;
      font-weight: 900;
      text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }}
    .sub-text {{
      position: absolute;
      bottom: 40px;
      width: 100%;
      text-align: center;
      color: #e2e8f0;
      font-size: 32px;
      font-weight: 600;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }}
  </style>
</head>
<body>
  <div class="header-text">אל תישארו מאחור. הלקוחות שלכם בנייד!</div>
  
  <div class="container">
    <div class="card">
      <div class="label">החנות הפיזית</div>
      <div class="img-container">
        <img src="data:image/png;base64,{store_photo_base64}" class="store-img" />
      </div>
    </div>
    
    <div class="arrow">⬅️</div>
    
    <div class="card" style="padding: 12px; background: #cbd5e0; border-radius: 36px;">
      <div class="label label-new">החנות הדיגיטלית</div>
      <div class="img-container" style="border: 8px solid #1a202c; border-radius: 28px; background: white; overflow: hidden; position: relative;">
        <!-- Using an iframe to load the live site directly instead of a screenshot -->
        <iframe src="https://electro-hankin.vercel.app" class="phone-img" scrolling="no"></iframe>
        <!-- Invisible overlay to prevent interaction -->
        <div style="position: absolute; top:0; left:0; right:0; bottom:0; z-index: 10;"></div>
      </div>
    </div>
  </div>
  
  <div class="sub-text">אתר קטלוג מהיר + הזמנות לוואטסאפ ב-0 ש"ח לחודש אחסון</div>
</body>
</html>
        """
        
    html_path = '/Users/yaniv/.copilot/session-state/048f15a8-1d82-4f68-b8a8-59046e08c5d2/files/facebook-ad-collage.html'
    with open(html_path, "w") as f:
        f.write(html)
        
    print(f"HTML generated at: {html_path}")

create_html()
