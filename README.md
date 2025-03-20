# Hệ thống Smart Billing

Phần mềm quản lý hoá đơn và thanh toán dành cho doanh nghiệp vừa và nhỏ.

## Tính năng

- Quản lý khách hàng
- Tạo và quản lý hoá đơn
- Theo dõi thanh toán
- Tìm kiếm hoá đơn theo số điện thoại
- Thống kê và báo cáo doanh thu
- Quản lý người dùng, phân quyền

## Yêu cầu hệ thống

- Node.js (phiên bản 14.x trở lên)
- NPM (phiên bản 6.x trở lên)
- SQLite3

## Cài đặt

### Trên Linux/MacOS

1. Clone repository về máy:
```bash
git clone https://github.com/yourusername/smart-billing.git
cd smart-billing
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Tạo file .env (có thể sao chép từ .env.example):
```bash
cp .env.example .env
```

4. Khởi tạo cơ sở dữ liệu:
```bash
npm run init-db
```

5. Khởi động ứng dụng:
```bash
npm start
```

6. Truy cập ứng dụng qua trình duyệt web tại địa chỉ: http://localhost:3000

### Trên Windows với XAMPP

1. Clone repository vào thư mục htdocs của XAMPP:
```bash
git clone https://github.com/yourusername/smart-billing.git C:\xampp\htdocs\smart-billing
cd C:\xampp\htdocs\smart-billing
```

2. Cài đặt Node.js và NPM cho Windows từ trang chủ: https://nodejs.org/

3. Cài đặt các gói phụ thuộc:
```bash
npm install
```

4. Tạo file .env (sao chép từ .env.example và chỉnh sửa nếu cần):
```bash
copy .env.example .env
```

5. Khởi tạo cơ sở dữ liệu:
```bash
npm run init-db
```

6. Khởi động ứng dụng:
```bash
npm start
```

7. Truy cập ứng dụng qua trình duyệt web tại địa chỉ: http://localhost:3000

### Trên Windows với WSL (Windows Subsystem for Linux)

1. Cài đặt WSL theo hướng dẫn của Microsoft: 
   https://docs.microsoft.com/en-us/windows/wsl/install

2. Mở terminal WSL và clone repository:
```bash
git clone https://github.com/yourusername/smart-billing.git
cd smart-billing
```

3. Cài đặt các gói phụ thuộc:
```bash
npm install
```

4. Tạo file .env:
```bash
cp .env.example .env
```

5. Khởi tạo cơ sở dữ liệu:
```bash
npm run init-db
```

6. Khởi động ứng dụng:
```bash
npm start
```

7. Truy cập ứng dụng qua trình duyệt web tại địa chỉ: http://localhost:3000
   - Lưu ý: Nếu sử dụng WSL 2, có thể cần thêm cấu hình để truy cập qua localhost

## Các tài khoản mặc định

Sau khi khởi tạo cơ sở dữ liệu, hệ thống sẽ tạo các tài khoản mặc định:

- **Admin**
  - Email: admin@example.com
  - Mật khẩu: admin123

- **Người dùng thường**
  - Email: user@example.com
  - Mật khẩu: user123

## Hướng dẫn sử dụng

1. **Đăng nhập**: Sử dụng email và mật khẩu từ các tài khoản mặc định hoặc đã được tạo
2. **Tạo khách hàng**: Vào mục "Khách hàng" và nhấn "Thêm khách hàng"
3. **Tạo hoá đơn**: Vào mục "Hoá đơn" và nhấn "Tạo hoá đơn"
4. **Ghi nhận thanh toán**: Vào mục "Thanh toán" và nhấn "Thêm thanh toán"
5. **Báo cáo**: Xem thống kê trong mục "Báo cáo" hoặc trên Bảng điều khiển

## Tính năng tìm kiếm nhanh

- Sử dụng ô tìm kiếm SĐT ở sidebar để tìm hoá đơn theo số điện thoại khách hàng
- Có thể tìm kiếm từ bất kỳ trang nào trong hệ thống

## Xử lý sự cố

### Không thể khởi động ứng dụng
- Kiểm tra Node.js đã được cài đặt chưa: `node -v`
- Kiểm tra cổng 3000 đã được sử dụng chưa: `npx kill-port 3000`
- Kiểm tra thư mục data đã được tạo chưa: `mkdir -p data`

### Lỗi khi khởi tạo cơ sở dữ liệu
- Đảm bảo quyền ghi vào thư mục data
- Thử xóa file database cũ: `rm data/database.sqlite`
- Chạy lại lệnh khởi tạo: `npm run init-db`

### Không thể đăng nhập
- Kiểm tra đúng email và mật khẩu
- Nếu quên mật khẩu, hãy sử dụng tài khoản admin để đặt lại mật khẩu cho người dùng

## Giấy phép

MIT License - Xem chi tiết trong file LICENSE
