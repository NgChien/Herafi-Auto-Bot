# Herafi-Auto-Bot

## Mô tả
Herafi-Auto-Bot là công cụ tự động hóa thao tác với nhiều ví trên mạng Optimism Sepolia, hỗ trợ các chức năng:
- Nhận faucet token tự động
- Swap token qua vault
- Cung cấp/rút thanh khoản tự động
- Giao diện dashboard trực quan trên terminal

## Yêu cầu
- Node.js >= 18
- Git
- Tài khoản RPC riêng (khuyến nghị, ví dụ: Alchemy, Infura, QuickNode...)

## Cài đặt
```bash
git clone https://github.com/NgChien/Herafi-Auto-Bot.git
cd Herafi-Auto-Bot
npm install
```

## Cấu hình
1. **Tạo file `pvkey.txt`**
   - Mỗi dòng là một private key của ví (không có tiền tố 0x).
   - Ví dụ:
     ```
     123abc...
     456def...
     ...
     ```
2. **Chỉnh sửa file `index.js` nếu cần:**
   - Thay đổi RPC_URL sang RPC riêng:
     ```js
     const RPC_URL = "https://opt-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
     ```
   - Điều chỉnh số luồng chạy song song (giới hạn để tránh bị chặn RPC):
     ```js
     const MAX_CONCURRENT = 2; // Số ví chạy cùng lúc
     ```
   - Bật/tắt các chức năng:
     ```js
     const ENABLE_FAUCET = true;      // Nhận faucet tự động
     const ENABLE_SWAP = false;       // Swap token
     const ENABLE_LIQUIDITY = false;  // Cung cấp/rút thanh khoản
     ```

## Chạy bot
```bash
node index.js
```
- Giao diện dashboard sẽ hiển thị trạng thái từng ví, log, tiến trình chu kỳ.
- Nhấn `q` để thoát bot.

## Lưu ý quan trọng
- **Luôn sử dụng RPC riêng** để tránh bị giới hạn request/giây.
- Không nên chạy quá nhiều ví cùng lúc với RPC công cộng.
- Nếu gặp lỗi về RPC, hãy giảm `MAX_CONCURRENT` và tăng delay trong code.
- Không chia sẻ private key cho bất kỳ ai.

## Ví dụ cấu hình nhanh
```js
const RPC_URL = "https://opt-sepolia.g.alchemy.com/v2/abc123...";
const MAX_CONCURRENT = 2;
const ENABLE_FAUCET = true;
const ENABLE_SWAP = false;
const ENABLE_LIQUIDITY = false;
```

## Đóng góp & Hỗ trợ
- Mọi ý kiến đóng góp, báo lỗi vui lòng tạo issue trên Github hoặc liên hệ tác giả. 
