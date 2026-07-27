export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground text-center p-4">
      <h1 className="text-4xl font-bold mb-4">403 - ไม่มีสิทธิ์เข้าถึง</h1>
      <p className="text-muted-foreground mb-8 text-lg max-w-md">
        คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากคุณเชื่อว่านี่คือข้อผิดพลาด
      </p>
      <a href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
        กลับสู่หน้าหลัก
      </a>
    </div>
  );
}
