(function() {
  var locales = {
    'en': { name: 'English', dir: 'ltr' },
    'pt-BR': { name: 'Português (Brasil)', dir: 'ltr' },
    'ru': { name: 'Русский', dir: 'ltr' },
    'tr': { name: 'Türkçe', dir: 'ltr' },
    'es': { name: 'Español', dir: 'ltr' },
    'fr': { name: 'Français', dir: 'ltr' },
    'de': { name: 'Deutsch', dir: 'ltr' },
    'it': { name: 'Italiano', dir: 'ltr' },
    'id': { name: 'Bahasa Indonesia', dir: 'ltr' },
    'ar': { name: 'العربية', dir: 'rtl' },
    'hi': { name: 'हिन्दी', dir: 'ltr' },
    'zh-CN': { name: '简体中文', dir: 'ltr' },
    'zh-TW': { name: '繁體中文', dir: 'ltr' },
    'ja': { name: '日本語', dir: 'ltr' },
    'ko': { name: '한국어', dir: 'ltr' },
    'vi': { name: 'Tiếng Việt', dir: 'ltr' },
    'th': { name: 'ไทย', dir: 'ltr' },
    'pl': { name: 'Polski', dir: 'ltr' },
    'uk': { name: 'Українська', dir: 'ltr' }
  };

  var dict = {
    '账号': {
      'en': 'Username', 'pt-BR': 'Usuário', 'ru': 'Имя пользователя', 'tr': 'Kullanıcı Adı', 'es': 'Usuario', 'fr': 'Nom d\'utilisateur', 'de': 'Benutzername', 'it': 'Nome utente', 'id': 'Nama Pengguna', 'ar': 'اسم المستخدم', 'hi': 'उपयोगकर्ता नाम', 'zh-CN': '账号', 'zh-TW': '帳號', 'ja': 'ユーザー名', 'ko': '사용자 이름', 'vi': 'Tên người dùng', 'th': 'ชื่อผู้ใช้', 'pl': 'Nazwa użytkownika', 'uk': 'Ім\'я користувача'
    },
    '密码': {
      'en': 'Password', 'pt-BR': 'Senha', 'ru': 'Пароль', 'tr': 'Şifre', 'es': 'Contraseña', 'fr': 'Mot de passe', 'de': 'Passwort', 'it': 'Password', 'id': 'Kata Sandi', 'ar': 'كلمة المرور', 'hi': 'पासवर्ड', 'zh-CN': '密码', 'zh-TW': '密碼', 'ja': 'パスワード', 'ko': '비밀번호', 'vi': 'Mật khẩu', 'th': 'รหัสผ่าน', 'pl': 'Hasło', 'uk': 'Пароль'
    },
    '请输入您的账号': {
      'en': 'Please enter your username', 'pt-BR': 'Por favor, insira seu usuário', 'ru': 'Введите имя пользователя', 'tr': 'Lütfen kullanıcı adınızı girin', 'es': 'Por favor, ingrese su usuario', 'fr': 'Veuillez entrer votre nom d\'utilisateur', 'de': 'Bitte geben Sie Ihren Benutzernamen ein', 'it': 'Inserisci il nome utente', 'id': 'Masukkan nama pengguna Anda', 'ar': 'الرجاء إدخال اسم المستخدم', 'hi': 'कृपया अपना उपयोगकर्ता नाम दर्ज करें', 'zh-CN': '请输入您的账号', 'zh-TW': '請輸入您的帳號', 'ja': 'ユーザー名を入力してください', 'ko': '사용자 이름을 입력하세요', 'vi': 'Vui lòng nhập tên người dùng', 'th': 'กรุณาใส่ชื่อผู้ใช้ของคุณ', 'pl': 'Wprowadź nazwę użytkownika', 'uk': 'Будь ласка, введіть ім\'я користувача'
    },
    '请输入您的密码': {
      'en': 'Please enter your password', 'pt-BR': 'Por favor, insira sua senha', 'ru': 'Введите пароль', 'tr': 'Lütfen şifrenizi girin', 'es': 'Por favor, ingrese su contraseña', 'fr': 'Veuillez entrer votre mot de passe', 'de': 'Bitte geben Sie Ihr Passwort ein', 'it': 'Inserisci la password', 'id': 'Masukkan kata sandi Anda', 'ar': 'الرجاء إدخال كلمة المرور', 'hi': 'कृपया अपना पासवर्ड दर्ज करें', 'zh-CN': '请输入您的密码', 'zh-TW': '請輸入您的密碼', 'ja': 'パスワードを入力してください', 'ko': '비밀번호를 입력하세요', 'vi': 'Vui lòng nhập mật khẩu', 'th': 'กรุณาใส่รหัสผ่านของคุณ', 'pl': 'Wprowadź hasło', 'uk': 'Будь ласка, введіть пароль'
    },
    '记住密码': {
      'en': 'Remember password', 'pt-BR': 'Lembrar senha', 'ru': 'Запомнить пароль', 'tr': 'Şifreyi hatırla', 'es': 'Recordar contraseña', 'fr': 'Se souvenir du mot de passe', 'de': 'Passwort merken', 'it': 'Ricorda password', 'id': 'Ingat kata sandi', 'ar': 'تذكر كلمة المرور', 'hi': 'पासवर्ड याद रखें', 'zh-CN': '记住密码', 'zh-TW': '記住密碼', 'ja': 'パスワードを記憶', 'ko': '비밀번호 기억', 'vi': 'Nhớ mật khẩu', 'th': 'จำรหัสผ่าน', 'pl': 'Zapamiętaj hasło', 'uk': 'Запам\'ятати пароль'
    },
    '登 录': {
      'en': 'Log In', 'pt-BR': 'Entrar', 'ru': 'Войти', 'tr': 'Giriş Yap', 'es': 'Iniciar Sesión', 'fr': 'Connexion', 'de': 'Anmelden', 'it': 'Accedi', 'id': 'Masuk', 'ar': 'تسجيل الدخول', 'hi': 'लॉग इन करें', 'zh-CN': '登录', 'zh-TW': '登入', 'ja': 'ログイン', 'ko': '로그인', 'vi': 'Đăng nhập', 'th': 'เข้าสู่ระบบ', 'pl': 'Zaloguj się', 'uk': 'Увійти'
    },
    '登录': {
      'en': 'Log In', 'pt-BR': 'Entrar', 'ru': 'Войти', 'tr': 'Giriş Yap', 'es': 'Iniciar Sesión', 'fr': 'Connexion', 'de': 'Anmelden', 'it': 'Accedi', 'id': 'Masuk', 'ar': 'تسجيل الدخول', 'hi': 'लॉग इन करें', 'zh-CN': '登录', 'zh-TW': '登入', 'ja': 'ログイン', 'ko': '로그인', 'vi': 'Đăng nhập', 'th': 'เข้าสู่ระบบ', 'pl': 'Zaloguj się', 'uk': 'Увійти'
    },
    '登 录 中...': {
      'en': 'Logging in...', 'pt-BR': 'Entrando...', 'ru': 'Вход...', 'tr': 'Giriş yapılıyor...', 'es': 'Iniciando sesión...', 'fr': 'Connexion en cours...', 'de': 'Anmeldung läuft...', 'it': 'Accesso in corso...', 'id': 'Masuk...', 'ar': 'جاري تسجيل الدخول...', 'hi': 'लॉग इन हो रहा है...', 'zh-CN': '登录中...', 'zh-TW': '登入中...', 'ja': 'ログイン中...', 'ko': '로그인 중...', 'vi': 'Đang đăng nhập...', 'th': 'กำลังเข้าสู่ระบบ...', 'pl': 'Logowanie...', 'uk': 'Вхід...'
    },
    '登录失败': {
      'en': 'Login failed', 'pt-BR': 'Falha no login', 'ru': 'Ошибка входа', 'tr': 'Giriş başarısız', 'es': 'Error de inicio de sesión', 'fr': 'Échec de la connexion', 'de': 'Anmeldung fehlgeschlagen', 'it': 'Accesso fallito', 'id': 'Gagal masuk', 'ar': 'فشل تسجيل الدخول', 'hi': 'लॉगिन विफल', 'zh-CN': '登录失败', 'zh-TW': '登入失敗', 'ja': 'ログイン失敗', 'ko': '로그인 실패', 'vi': 'Đăng nhập thất bại', 'th': 'เข้าสู่ระบบไม่สำเร็จ', 'pl': 'Logowanie nie powiodło się', 'uk': 'Помилка входу'
    },
    '网络连接失败': {
      'en': 'Network connection failed', 'pt-BR': 'Falha na conexão de rede', 'ru': 'Ошибка подключения к сети', 'tr': 'Ağ bağlantısı başarısız', 'es': 'Error de conexión de red', 'fr': 'Échec de la connexion réseau', 'de': 'Netzwerkverbindung fehlgeschlagen', 'it': 'Connessione di rete fallita', 'id': 'Koneksi jaringan gagal', 'ar': 'فشل الاتصال بالشبكة', 'hi': 'नेटवर्क कनेक्शन विफल', 'zh-CN': '网络连接失败', 'zh-TW': '網路連接失敗', 'ja': 'ネットワーク接続に失敗しました', 'ko': '네트워크 연결 실패', 'vi': 'Kết nối mạng thất bại', 'th': 'การเชื่อมต่อเครือข่ายล้มเหลว', 'pl': 'Błąd połączenia sieciowego', 'uk': 'Помилка підключення до мережі'
    },
    '已退出登录': {
      'en': 'Logged out successfully', 'pt-BR': 'Deslogado com sucesso', 'ru': 'Выход выполнен успешно', 'tr': 'Başarıyla çıkış yapıldı', 'es': 'Sesión cerrada con éxito', 'fr': 'Déconnexion réussie', 'de': 'Erfolgreich abgemeldet', 'it': 'Disconnesso con successo', 'id': 'Berhasil keluar', 'ar': 'تم تسجيل الخروج بنجاح', 'hi': 'सफलतापूर्वक लॉग आउट किया गया', 'zh-CN': '已退出登录', 'zh-TW': '已登出', 'ja': 'ログアウトしました', 'ko': '로그아웃되었습니다', 'vi': 'Đăng xuất thành công', 'th': 'ออกจากระบบสำเร็จ', 'pl': 'Wylogowano pomyślnie', 'uk': 'Успішно вийшли з системи'
    },
    '设备控制': {
      'en': 'Device Control', 'pt-BR': 'Controle de Dispositivo', 'ru': 'Управление устройством', 'tr': 'Cihaz Kontrolü', 'es': 'Control de Dispositivo', 'fr': 'Contrôle des Appareils', 'de': 'Gerätesteuerung', 'it': 'Controllo Dispositivo', 'id': 'Kontrol Perangkat', 'ar': 'التحكم في الجهاز', 'hi': 'डിവाइस नियंत्रण', 'zh-CN': '设备控制', 'zh-TW': '設備控制', 'ja': 'デバイス制御', 'ko': '디바이스 제어', 'vi': 'Điều khiển thiết bị', 'th': 'การควบคุมอุปกรณ์', 'pl': 'Kontrola urządzenia', 'uk': 'Керування пристроєм'
    },
    '短信通知': {
      'en': 'SMS Notifications', 'pt-BR': 'Notificações SMS', 'ru': 'SMS-уведомления', 'tr': 'SMS Bildirimleri', 'es': 'Notificaciones SMS', 'fr': 'Notifications SMS', 'de': 'SMS-Benachrichtigungen', 'it': 'Notifiche SMS', 'id': 'Notifikasi SMS', 'ar': 'إشعارات الرسائل القصيرة', 'hi': 'एसएमएस सूचनाएं', 'zh-CN': '短信通知', 'zh-TW': '簡訊通知', 'ja': 'SMS通知', 'ko': 'SMS 알림', 'vi': 'Thông báo SMS', 'th': 'การแจ้งเตือน SMS', 'pl': 'Powiadomienia SMS', 'uk': 'SMS-сповіщення'
    },
    'APK 管理': {
      'en': 'APK Management', 'pt-BR': 'Gerenciamento APK', 'ru': 'Управление APK', 'tr': 'APK Yönetimi', 'es': 'Gestión APK', 'fr': 'Gestion APK', 'de': 'APK-Verwaltung', 'it': 'Gestione APK', 'id': 'Manajemen APK', 'ar': 'إدارة APK', 'hi': 'APK प्रबंधन', 'zh-CN': 'APK 管理', 'zh-TW': 'APK 管理', 'ja': 'APK管理', 'ko': 'APK 관리', 'vi': 'Quản lý APK', 'th': 'การจัดการ APK', 'pl': 'Zarządzanie APK', 'uk': 'Керування APK'
    },
    'AB包管理': {
      'en': 'AB Pack Management', 'pt-BR': 'Gerenciamento Pacote AB', 'ru': 'Управление пакетами AB', 'tr': 'AB Paket Yönetimi', 'es': 'Gestión Paquetes AB', 'fr': 'Gestion Pack AB', 'de': 'AB-Paket-Verwaltung', 'it': 'Gestione Pacchetto AB', 'id': 'Manajemen Paket AB', 'ar': 'إدارة حزم AB', 'hi': 'AB पैक प्रबंधन', 'zh-CN': 'AB包管理', 'zh-TW': 'AB包管理', 'ja': 'ABパック管理', 'ko': 'AB 팩 관리', 'vi': 'Quản lý gói AB', 'th': 'การจัดการแพ็คเกจ AB', 'pl': 'Zarządzanie pakietami AB', 'uk': 'Керування пакетами AB'
    },
    '设置管理': {
      'en': 'Settings', 'pt-BR': 'Configurações', 'ru': 'Настройки', 'tr': 'Ayarlar', 'es': 'Configuración', 'fr': 'Paramètres', 'de': 'Einstellungen', 'it': 'Impostazioni', 'id': 'Pengaturan', 'ar': 'الإعدادات', 'hi': 'सेटिंग्स', 'zh-CN': '设置管理', 'zh-TW': '設定管理', 'ja': '設定', 'ko': '설정', 'vi': 'Cài đặt', 'th': 'การตั้งค่า', 'pl': 'Ustawienia', 'uk': 'Налаштування'
    },
    '全局注入': {
      'en': 'Global Injection', 'pt-BR': 'Injeção Global', 'ru': 'Глобальная инъекция', 'tr': 'Küresel Enjeksiyon', 'es': 'Inyección Global', 'fr': 'Injection Globale', 'de': 'Globale Injektion', 'it': 'Iniezione Globale', 'id': 'Injeksi Global', 'ar': 'الحقن الشامل', 'hi': 'वैश्विक इंजेक्शन', 'zh-CN': '全局注入', 'zh-TW': '全域注入', 'ja': 'グローバルインジェクション', 'ko': '전역 주입', 'vi': 'Tiêm toàn cục', 'th': 'การฉีดทั่วโลก', 'pl': 'Iniekcja globalna', 'uk': 'Глобальна ін\'єкція'
    },
    '服务器状态': {
      'en': 'Server Status', 'pt-BR': 'Status do Servidor', 'ru': 'Статус сервера', 'tr': 'Sunucu Durumu', 'es': 'Estado del Servidor', 'fr': 'État du Serveur', 'de': 'Serverstatus', 'it': 'Stato del Server', 'id': 'Status Server', 'ar': 'حالة الخادم', 'hi': 'सर्वर स्थिति', 'zh-CN': '服务器状态', 'zh-TW': '伺服器狀態', 'ja': 'サーバー状況', 'ko': '서버 상태', 'vi': 'Trạng thái máy chủ', 'th': 'สถานะเซิร์ฟเวอร์', 'pl': 'Status serwera', 'uk': 'Статус сервера'
    },
    '设备分组': {
      'en': 'Device Groups', 'pt-BR': 'Grupos de Dispositivos', 'ru': 'Группы устройств', 'tr': 'Cihaz Grupları', 'es': 'Grupos de Dispositivos', 'fr': 'Groupes d\'Appareils', 'de': 'Gerätegruppen', 'it': 'Gruppi Dispositivi', 'id': 'Grup Perangkat', 'ar': 'مجموعات الأجهزة', 'hi': 'डിവाइस समूह', 'zh-CN': '设备分组', 'zh-TW': '設備群組', 'ja': 'デバイスグループ', 'ko': '디바이스 그룹', 'vi': 'Nhóm thiết bị', 'th': 'กลุ่มอุปกรณ์', 'pl': 'Grupy urządzeń', 'uk': 'Групи пристроїв'
    },
    '在线设备': {
      'en': 'Online Devices', 'pt-BR': 'Dispositivos Online', 'ru': 'Онлайн-устройства', 'tr': 'Çevrimiçi Cihazlar', 'es': 'Dispositivos en Línea', 'fr': 'Appareils en Ligne', 'de': 'Online-Geräte', 'it': 'Dispositivi Online', 'id': 'Perangkat Online', 'ar': 'الأجهزة المتصلة', 'hi': 'ऑनलाइन डിവाइस', 'zh-CN': '在线设备', 'zh-TW': '線上設備', 'ja': 'オンライン端末', 'ko': '온라인 디바이스', 'vi': 'Thiết bị trực tuyến', 'th': 'อุปกรณ์ออนไลน์', 'pl': 'Urządzenia online', 'uk': 'Онлайн-пристрої'
    },
    '退出登录': {
      'en': 'Log Out', 'pt-BR': 'Sair', 'ru': 'Выйти', 'tr': 'Çıkış Yap', 'es': 'Cerrar Sesión', 'fr': 'Se déconnecter', 'de': 'Abmelden', 'it': 'Disconnetti', 'id': 'Keluar', 'ar': 'تسجيل الخروج', 'hi': 'लॉग आउट', 'zh-CN': '退出登录', 'zh-TW': '登出', 'ja': 'ログアウト', 'ko': '로그아웃', 'vi': 'Đăng xuất', 'th': 'ออกจากระบบ', 'pl': 'Wyloguj', 'uk': 'Вийти'
    },
    '确认登出': {
      'en': 'Confirm Logout', 'pt-BR': 'Confirmar Saída', 'ru': 'Подтвердить выход', 'tr': 'Çıkışı Onayla', 'es': 'Confirmar Cierre de Sesión', 'fr': 'Confirmer la Déconnexion', 'de': 'Abmeldung bestätigen', 'it': 'Conferma Disconnessione', 'id': 'Konfirmasi Keluar', 'ar': 'تأكيد تسجيل الخروج', 'hi': 'लॉग आउट की पुष्टि करें', 'zh-CN': '确认登出', 'zh-TW': '確認登出', 'ja': 'ログアウトの確認', 'ko': '로그아웃 확인', 'vi': 'Xác nhận đăng xuất', 'th': 'ยืนยันการออกจากระบบ', 'pl': 'Potwierdź wylogowanie', 'uk': 'Підтвердити вихід'
    },
    '您确定要退出登录吗？': {
      'en': 'Are you sure you want to log out?', 'pt-BR': 'Tem certeza de que deseja sair?', 'ru': 'Вы действительно хотите выйти?', 'tr': 'Çıkış yapmak istediğinizden emin misiniz?', 'es': '¿Está seguro de que desea cerrar sesión?', 'fr': 'Êtes-vous sûr de vouloir vous déconnecter ?', 'de': 'Möchten Sie sich wirklich abmelden?', 'it': 'Sei sicuro di voler effettuare il logout?', 'id': 'Apakah Anda yakin ingin keluar?', 'ar': 'هل أنت متأكد أنك تريد تسجيل الخروج؟', 'hi': 'क्या आप वाकई लॉग आउट करना चाहते हैं?', 'zh-CN': '您确定要退出登录吗？', 'zh-TW': '您確定要登出嗎？', 'ja': 'ログアウトしますか？', 'ko': '정말 로그아웃하시겠습니까?', 'vi': 'Bạn có chắc chắn muốn đăng xuất không?', 'th': 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?', 'pl': 'Czy na pewno chcesz się wylogować?', 'uk': 'Ви дійсно хочете вийти з системи?'
    },
    '确认': {
      'en': 'Confirm', 'pt-BR': 'Confirmar', 'ru': 'Подтвердить', 'tr': 'Onayla', 'es': 'Confirmar', 'fr': 'Confirmer', 'de': 'Bestätigen', 'it': 'Conferma', 'id': 'Konfirmasi', 'ar': 'تأكيد', 'hi': 'पुष्टि करें', 'zh-CN': '确认', 'zh-TW': '確認', 'ja': '確認', 'ko': '확인', 'vi': 'Xác nhận', 'th': 'ยืนยัน', 'pl': 'Potwierdź', 'uk': 'Підтвердити'
    },
    '取消': {
      'en': 'Cancel', 'pt-BR': 'Cancelar', 'ru': 'Отмена', 'tr': 'İptal', 'es': 'Cancelar', 'fr': 'Annuler', 'de': 'Abbrechen', 'it': 'Annulla', 'id': 'Batal', 'ar': 'إلغاء', 'hi': 'रद्द करें', 'zh-CN': '取消', 'zh-TW': '取消', 'ja': 'キャンセル', 'ko': '취소', 'vi': 'Hủy', 'th': 'ยกเลิก', 'pl': 'Anuluj', 'uk': 'Скасувати'
    },
    '刷新': {
      'en': 'Refresh', 'pt-BR': 'Atualizar', 'ru': 'Обновить', 'tr': 'Yenile', 'es': 'Actualizar', 'fr': 'Actualiser', 'de': 'Aktualisieren', 'it': 'Aggiorna', 'id': 'Segarkan', 'ar': 'تحديث', 'hi': 'रीफ्रेश करें', 'zh-CN': '刷新', 'zh-TW': '重新整理', 'ja': '更新', 'ko': '새로고침', 'vi': 'Làm mới', 'th': 'รีเฟรช', 'pl': 'Odśwież', 'uk': 'Оновити'
    },
    '全选': {
      'en': 'Select All', 'pt-BR': 'Selecionar Tudo', 'ru': 'Выбрать все', 'tr': 'Tümünü Seç', 'es': 'Seleccionar Todo', 'fr': 'Tout sélectionner', 'de': 'Alle auswählen', 'it': 'Seleziona tutto', 'id': 'Pilih Semua', 'ar': 'تحديد الكل', 'hi': 'सभी चुनें', 'zh-CN': '全选', 'zh-TW': '全選', 'ja': 'すべて選択', 'ko': '모두 선택', 'vi': 'Chọn tất cả', 'th': 'เลือกทั้งหมด', 'pl': 'Zaznacz wszystko', 'uk': 'Вибрати все'
    },
    '批量删除': {
      'en': 'Batch Delete', 'pt-BR': 'Exclusão em Lote', 'ru': 'Массовое удаление', 'tr': 'Toplu Silme', 'es': 'Eliminación por Lotes', 'fr': 'Suppression par Lot', 'de': 'Massenlöschung', 'it': 'Eliminazione in Batch', 'id': 'Hapus Massal', 'ar': 'حذف مجمع', 'hi': 'बैッチ हटाएं', 'zh-CN': '批量删除', 'zh-TW': '批量刪除', 'ja': '一括削除', 'ko': '일괄 삭제', 'vi': 'Xóa hàng loạt', 'th': 'ลบแบบชุด', 'pl': 'Usuwanie grupowé', 'uk': 'Масове видалення'
    },
    '品牌': {
      'en': 'Brand', 'pt-BR': 'Marca', 'ru': 'Бренд', 'tr': 'Marka', 'es': 'Marca', 'fr': 'Marque', 'de': 'Marke', 'it': 'Marca', 'id': 'Merek', 'ar': 'العلامة التجارية', 'hi': 'ब्रांड', 'zh-CN': '品牌', 'zh-TW': '品牌', 'ja': 'ブランド', 'ko': '브랜드', 'vi': 'Thương hiệu', 'th': 'แบรนด์', 'pl': 'Marka', 'uk': 'Бренд'
    },
    '备注': {
      'en': 'Remark', 'pt-BR': 'Observação', 'ru': 'Примечание', 'tr': 'Not', 'es': 'Nota', 'fr': 'Remarque', 'de': 'Bemerkung', 'it': 'Nota', 'id': 'Catatan', 'ar': 'ملاحظة', 'hi': 'टिप्पणी', 'zh-CN': '备注', 'zh-TW': '備註', 'ja': '備考', 'ko': '비고', 'vi': 'Ghi chú', 'th': 'หมายเหตุ', 'pl': 'Uwaga', 'uk': 'Примітка'
    },
    '查询': {
      'en': 'Query', 'pt-BR': 'Pesquisar', 'ru': 'Запрос', 'tr': 'Sorgula', 'es': 'Consultar', 'fr': 'Rechercher', 'de': 'Abfragen', 'it': 'Cerca', 'id': 'Cari', 'ar': 'بحث', 'hi': 'क्वेरी', 'zh-CN': '查询', 'zh-TW': '查詢', 'ja': '検索', 'ko': '조회', 'vi': 'Truy vấn', 'th': 'ค้นหา', 'pl': 'Zapytanie', 'uk': 'Запит'
    },
    '重置': {
      'en': 'Reset', 'pt-BR': 'Redefinir', 'ru': 'Сбросить', 'tr': 'Sıfırla', 'es': 'Restablecer', 'fr': 'Réinitialiser', 'de': 'Zurücksetzen', 'it': 'Ripristina', 'id': 'Atur Ulang', 'ar': 'إعادة تعيين', 'hi': 'रीसेट', 'zh-CN': '重置', 'zh-TW': '重置', 'ja': 'リセット', 'ko': '초기화', 'vi': 'Đặt lại', 'th': 'รีเซ็ต', 'pl': 'Resetuj', 'uk': 'Скинути'
    }
  };

  function getStoredLang() {
    try {
      var stored = localStorage.getItem('panda_language_preference');
      if (locales[stored]) return stored;
    } catch (e) {}
    return 'en';
  }

  function setLanguage(langCode) {
    if (!locales[langCode]) langCode = 'en';
    try {
      localStorage.setItem('panda_language_preference', langCode);
    } catch (e) {}
    document.documentElement.setAttribute('lang', langCode);
    document.documentElement.setAttribute('dir', locales[langCode].dir);
    translatePage(langCode);
  }

  function translatePage(langCode) {
    if (langCode === 'en') return; // default is source text
    var langDict = {};
    for (var k in dict) {
      if (dict[k][langCode]) {
        langDict[k] = dict[k][langCode];
      }
    }

    // Traverse text nodes and placeholders
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while (node = walker.nextNode()) {
      var text = node.nodeValue.trim();
      if (langDict[text]) {
        node.nodeValue = node.nodeValue.replace(text, langDict[text]);
      }
    }

    // Translate placeholders & titles
    var elements = document.querySelectorAll('[placeholder], [title], [aria-label]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var p = el.getAttribute('placeholder');
      if (p && langDict[p]) el.setAttribute('placeholder', langDict[p]);
      var t = el.getAttribute('title');
      if (t && langDict[t]) el.setAttribute('title', langDict[t]);
    }
  }

  // Mount language selector ONLY on login page
  function mountLangSelector() {
    if (document.getElementById('panda-lang-selector-widget')) return;
    var loginCard = document.querySelector('.panda-login-card') || document.querySelector('form');
    if (!loginCard) return;

    var container = document.createElement('div');
    container.id = 'panda-lang-selector-widget';
    container.className = 'panda-lang-selector-wrapper';

    var currentLang = getStoredLang();
    var html = '<select id="panda-lang-select" class="panda-lang-select" aria-label="Select Language">';
    for (var code in locales) {
      var selected = code === currentLang ? ' selected' : '';
      html += '<option value="' + code + '"' + selected + '>' + locales[code].name + '</option>';
    }
    html += '</select>';
    container.innerHTML = html;

    // Insert near username/password fields in login card/form
    var firstItem = loginCard.querySelector('.ant-form-item') || loginCard.firstChild;
    if (firstItem) {
      loginCard.insertBefore(container, firstItem);
    } else {
      loginCard.appendChild(container);
    }

    var select = document.getElementById('panda-lang-select');
    select.addEventListener('change', function() {
      setLanguage(this.value);
      // Reload or re-apply translations immediately
      window.location.reload();
    });
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', function() {
    var lang = getStoredLang();
    setLanguage(lang);
    mountLangSelector();
  });

  var observer = new MutationObserver(function() {
    var lang = getStoredLang();
    if (document.documentElement.getAttribute('lang') !== lang) {
      setLanguage(lang);
    }
    if (document.querySelector('.panda-login-card') && !document.getElementById('panda-lang-selector-widget')) {
      mountLangSelector();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
