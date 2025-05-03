# 🚀 Herafi-Auto-Bot

> **Tự động hóa các tác vụ DeFi đa ví với bảng điều khiển terminal đẹp mắt.**

---

## ✨ Tính năng

- **Hỗ trợ nhiều ví**: Tự động hóa tác vụ cho số lượng ví không giới hạn.
- **Bảng điều khiển Terminal tương tác**: Nhật ký thời gian thực, trạng thái ví và thanh tiến trình.
- **Tự động hóa DeFi**: Nhận faucet, hoán đổi token, cung cấp thanh khoản và nhiều hơn nữa.
- **Tự động lặp lại**: Chạy các tác vụ sau mỗi X phút (có thể cấu hình).
- **Xử lý lỗi & Nhật ký**: Luôn cập nhật mọi bước thực hiện.

---

## 🖥️ Demo

![Ảnh minh họa](https://github.com/user-attachments/assets/fc684d9c-ddc9-4401-b380-8464062d7b73)

---

## ⚡️ Bắt đầu nhanh

### 1. **Clone Repo**

### 2. **Cài đặt thư viện**
```
npm install
```

### 3. **Cấu hình môi trường**

- Tạo file `.env`:
```
RPC_URL=https://sepolia.optimism.io
CYCLE_MINUTES=60
```
- Thêm **private key** ví của bạn (mỗi dòng một key) vào file `pvkey.txt`  
**Không bao giờ chia sẻ hoặc commit file này!**

### 4. **Chạy Bot**
```
node index.js
```

---

## 🛠️ Hướng dẫn sử dụng

- **Nhật ký**: Xem log thời gian thực ở phía dưới.
- **Bảng ví**: Xem trạng thái, tác vụ gần nhất và số dư của từng ví.
- **Thanh tiến trình**: Hiển thị tiến độ chu kỳ (tự động làm mới).
- **Thoát**: Nhấn `Q` hoặc `Ctrl+C` để thoát.

---

## 🧩 Các tác vụ hỗ trợ

- **Nhận Faucet**: Tự động nhận token test cho từng ví.
- **Hoán đổi Token**: Hoán đổi giữa hDEFI, WETH, CRV, SUSHI, UNI và USDC.
- **Quản lý thanh khoản**: Thêm và rút thanh khoản khỏi pool.
- **Theo dõi số dư ETH**: Luôn biết số dư ETH của ví.

---

## 📝 Chi tiết cấu trúc file

| File/Thư mục   | Mục đích                                                                 |
|----------------|--------------------------------------------------------------------------|
| `index.js`     | Script chính chứa toàn bộ logic bot                                      |
| `.env`         | Biến môi trường (không bao giờ commit thông tin nhạy cảm!)               |
| `pvkey.txt`    | Private key của bạn (mỗi dòng một key, giữ an toàn & bí mật!)            |
| `assets/`      | (Tùy chọn) Thư mục chứa GIF, hình ảnh hoặc banner cho repo                |
| `README.md`    | Tài liệu này                                                             |
| `package.json` | Quản lý thư viện dự án                                                   |

---

## 🚨 Cảnh báo bảo mật

> **Không bao giờ chia sẻ, tải lên hoặc commit file `pvkey.txt` hay bất kỳ private key nào!**
>
> Luôn sử dụng ví test và testnet khi phát triển.

---

## 🤝 Đóng góp

Chào đón pull request!  
Với thay đổi lớn, hãy mở issue trước để thảo luận.

---

## 📄 Giấy phép

[MIT](LICENSE)

---

## 🙏 Ghi nhận

- [blessed](https://github.com/chjj/blessed) & [blessed-contrib](https://github.com/yaronn/blessed-contrib) cho giao diện terminal
- [ethers.js](https://github.com/ethers-io/ethers.js/) cho tương tác blockchain
- [ora](https://github.com/sindresorhus/ora) cho spinner
- [dotenv](https://github.com/motdotla/dotenv) cho quản lý biến môi trường
- [Tác giả](https://t.me/Offical_Im_kazuha) để biết thêm chi tiết

---

## 🌐 Kết nối

- [GitHub Issues](https://github.com/Kazuha787/Herafi-Auto-Bot/issues) - Báo lỗi hoặc yêu cầu tính năng

---

**Chúc bạn tự động hóa vui vẻ!** 🚀

---

**Mẹo nhỏ:**  
Thêm GIF hoặc banner của riêng bạn vào thư mục `/assets` và cập nhật link ảnh phía trên để cá nhân hóa! 
