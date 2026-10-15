(function() {
  var locales = {
    'zh-CN': { name: '简体中文 (Canonical)', dir: 'ltr' },
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
    'zh-TW': { name: '繁體中文', dir: 'ltr' },
    'ja': { name: '日本語', dir: 'ltr' },
    'ko': { name: '한국어', dir: 'ltr' },
    'vi': { name: 'Tiếng Việt', dir: 'ltr' },
    'th': { name: 'ไทย', dir: 'ltr' },
    'pl': { name: 'Polski', dir: 'ltr' },
    'uk': { name: 'Українська', dir: 'ltr' }
  };

  var dict = {
    // Login & Auth
    '账号': {
      'en': 'Username', 'pt-BR': 'Usuário', 'ru': 'Имя пользователя', 'tr': 'Kullanıcı adı', 'es': 'Usuario', 'fr': 'Nom d\'utilisateur', 'de': 'Benutzername', 'it': 'Nome utente', 'id': 'Nama Pengguna', 'ar': 'اسم المستخدم', 'hi': 'उपयोगकर्ता नाम', 'zh-CN': '账号', 'zh-TW': '帳號', 'ja': 'ユーザー名', 'ko': '사용자 이름', 'vi': 'Tên người dùng', 'th': 'ชื่อผู้ใช้', 'pl': 'Nazwa użytkownika', 'uk': 'Ім\'я користувача'
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
      'en': 'Log In', 'pt-BR': 'Entrar', 'ru': 'Войти', 'tr': 'Giriş yap', 'es': 'Iniciar Sesión', 'fr': 'Connexion', 'de': 'Anmelden', 'it': 'Accedi', 'id': 'Masuk', 'ar': 'تسجيل الدخول', 'hi': 'लॉग इन करें', 'zh-CN': '登 录', 'zh-TW': '登入', 'ja': 'ログイン', 'ko': '로그인', 'vi': 'Đăng nhập', 'th': 'เข้าสู่ระบบ', 'pl': 'Zaloguj się', 'uk': 'Увійти'
    },
    '登录': {
      'en': 'Log In', 'pt-BR': 'Entrar', 'ru': 'Войти', 'tr': 'Giriş yap', 'es': 'Iniciar Sesión', 'fr': 'Connexion', 'de': 'Anmelden', 'it': 'Accedi', 'id': 'Masuk', 'ar': 'تسجيل الدخول', 'hi': 'लॉग इन करें', 'zh-CN': '登录', 'zh-TW': '登入', 'ja': 'ログイン', 'ko': '로그인', 'vi': 'Đăng nhập', 'th': 'เข้าสู่ระบบ', 'pl': 'Zaloguj się', 'uk': 'Увійти'
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

    // Sidebar Navigation & Modules
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
    '全部设备': {
      'en': 'All Devices', 'pt-BR': 'Todos os Dispositivos', 'ru': 'Все устройства', 'tr': 'Tüm Cihazlar', 'es': 'Todos los Dispositivos', 'fr': 'Tous les Appareils', 'de': 'Alle Geräte', 'it': 'Tutti i Dispositivi', 'id': 'Semua Perangkat', 'ar': 'جميع الأجهزة', 'hi': 'सभी डിവाइस', 'zh-CN': '全部设备', 'zh-TW': '全部設備', 'ja': 'すべてのデバイス', 'ko': '모든 디바이스', 'vi': 'Tất cả thiết bị', 'th': 'อุปกรณ์ทั้งหมด', 'pl': 'Wszystkie urządzenia', 'uk': 'Всі пристрої'
    },
    '新建分组': {
      'en': 'New Group', 'pt-BR': 'Novo Grupo', 'ru': 'Новая группа', 'tr': 'Yeni Grup', 'es': 'Nuevo Grupo', 'fr': 'Nouveau Groupe', 'de': 'Neue Gruppe', 'it': 'Nuovo Gruppo', 'id': 'Grup Baru', 'ar': 'مجموعة جديدة', 'hi': 'नया समूह', 'zh-CN': '新建分组', 'zh-TW': '新建群組', 'ja': '新規グループ', 'ko': '새 그룹', 'vi': 'Nhóm mới', 'th': 'กลุ่มใหม่', 'pl': 'Nowa grupa', 'uk': 'Нова група'
    },

    // Header & Profile Actions
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

    // Buttons, Tables, Pagination & Actions
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
    },
    '确认': {
      'en': 'Confirm', 'pt-BR': 'Confirmar', 'ru': 'Подтвердить', 'tr': 'Onayla', 'es': 'Confirmar', 'fr': 'Confirmer', 'de': 'Bestätigen', 'it': 'Conferma', 'id': 'Konfirmasi', 'ar': 'تأكيد', 'hi': 'पुष्टि करें', 'zh-CN': '确认', 'zh-TW': '確認', 'ja': '確認', 'ko': '확인', 'vi': 'Xác nhận', 'th': 'ยืนยัน', 'pl': 'Potwierdź', 'uk': 'Підтвердити'
    },
    '取消': {
      'en': 'Cancel', 'pt-BR': 'Cancelar', 'ru': 'Отмена', 'tr': 'İptal', 'es': 'Cancelar', 'fr': 'Annuler', 'de': 'Abbrechen', 'it': 'Annulla', 'id': 'Batal', 'ar': 'إلغاء', 'hi': 'रद्द करें', 'zh-CN': '取消', 'zh-TW': '取消', 'ja': 'キャンセル', 'ko': '취소', 'vi': 'Hủy', 'th': 'ยกเลิก', 'pl': 'Anuluj', 'uk': 'Скасувати'
    },

    // Device Control Tab Strings
    '卡片模式': {
      'en': 'Card Mode', 'pt-BR': 'Modo Cartão', 'ru': 'Режим карточек', 'tr': 'Kart Modu', 'es': 'Modo Tarjeta', 'fr': 'Mode Carte', 'de': 'Kartenmodus', 'it': 'Modalità Scheda', 'id': 'Mode Kartu', 'ar': 'وضع البطاقة', 'hi': 'कार्ड मोड', 'zh-CN': '卡片模式', 'zh-TW': '卡片模式', 'ja': 'カードモード', 'ko': '카드 모드', 'vi': 'Chế độ thẻ', 'th': 'โหมดการ์ด', 'pl': 'Tryb kart', 'uk': 'Режим карток'
    },
    '简洁模式': {
      'en': 'Compact Mode', 'pt-BR': 'Modo Compacto', 'ru': 'Компактный режим', 'tr': 'Kompakt Mod', 'es': 'Modo Compacto', 'fr': 'Mode Compact', 'de': 'Kompaktmodus', 'it': 'Modalità Compatta', 'id': 'Mode Kompak', 'ar': 'الوضع المدمج', 'hi': 'कॉम्पैक्ट मोड', 'zh-CN': '简洁模式', 'zh-TW': '簡潔模式', 'ja': 'コンパクトモード', 'ko': '컴팩트 모드', 'vi': 'Chế độ gọn', 'th': 'โหมดกะทัดรัด', 'pl': 'Tryb kompaktowy', 'uk': 'Компактний режим'
    },
    '点亮屏幕': {
      'en': 'Wake Screen', 'pt-BR': 'Acordar Tela', 'ru': 'Включить экран', 'tr': 'Ekranı Uyandır', 'es': 'Encender Pantalla', 'fr': 'Allumer l\'Écran', 'de': 'Bildschirm aufwachen', 'it': 'Riattiva Schermo', 'id': 'Bangunkan Layar', 'ar': 'إيقاظ الشاشة', 'hi': 'स्क्रीन जगाएं', 'zh-CN': '点亮屏幕', 'zh-TW': '點亮螢幕', 'ja': '画面を点灯', 'ko': '화면 켜기', 'vi': 'Bật sáng màn hình', 'th': 'ปลุกหน้าจอ', 'pl': 'Wybudź ekran', 'uk': 'Увімкнути екран'
    },
    '锁定屏幕': {
      'en': 'Lock Screen', 'pt-BR': 'Bloquear Tela', 'ru': 'Заблокировать экран', 'tr': 'Ekranı Kilitle', 'es': 'Bloquear Pantalla', 'fr': 'Verrouiller l\'Écran', 'de': 'Bildschirm sperren', 'it': 'Blocca Schermo', 'id': 'Kunci Layar', 'ar': 'قفل الشاشة', 'hi': 'स्क्रीन लॉक करें', 'zh-CN': '锁定屏幕', 'zh-TW': '鎖定螢幕', 'ja': '画面をロック', 'ko': '화면 잠금', 'vi': 'Khóa màn hình', 'th': 'ล็อกหน้าจอ', 'pl': 'Zablokuj ekran', 'uk': 'Заблокувати екран'
    },
    '开始控制': {
      'en': 'Start Control', 'pt-BR': 'Iniciar Controle', 'ru': 'Начать управление', 'tr': 'Kontrolü Başlat', 'es': 'Iniciar Control', 'fr': 'Démarrer le Contrôle', 'de': 'Steuerung Starten', 'it': 'Inizia Controllo', 'id': 'Mulai Kontrol', 'ar': 'بدء التحكم', 'hi': 'नियंत्रण शुरू करें', 'zh-CN': '开始控制', 'zh-TW': '開始控制', 'ja': 'コントロール開始', 'ko': '제어 시작', 'vi': 'Bắt đầu điều khiển', 'th': 'เริ่มควบคุม', 'pl': 'Rozpocznij kontrolę', 'uk': 'Почати керування'
    },
    '关闭控制': {
      'en': 'Close Control', 'pt-BR': 'Fechar Controle', 'ru': 'Остановить управление', 'tr': 'Kontrolü Kapat', 'es': 'Cerrar Control', 'fr': 'Fermer le Contrôle', 'de': 'Steuerung Schließen', 'it': 'Chiudi Controllo', 'id': 'Tutup Kontrol', 'ar': 'إغلاق التحكم', 'hi': 'नियंत्रण बंद करें', 'zh-CN': '关闭控制', 'zh-TW': '關閉控制', 'ja': 'コントロール終了', 'ko': '제어 종료', 'vi': 'Đóng điều khiển', 'th': 'ปิดการควบคุม', 'pl': 'Zamknij kontrolę', 'uk': 'Закрити керування'
    },
    '黑屏遮挡': {
      'en': 'Black Screen', 'pt-BR': 'Tela Preta', 'ru': 'Черный экран', 'tr': 'Siyah Ekran', 'es': 'Pantalla Negra', 'fr': 'Écran Noir', 'de': 'Bildschirmschwärzung', 'it': 'Schermo Nero', 'id': 'Layar Hitam', 'ar': 'شاشة سوداء', 'hi': 'काली स्क्रीन', 'zh-CN': '黑屏遮挡', 'zh-TW': '黑屏遮擋', 'ja': '画面黒幕', 'ko': '암전', 'vi': 'Màn hình đen', 'th': 'จอภาพสีดำ', 'pl': 'Czarny ekran', 'uk': 'Чорний екран'
    },
    '系统更新': {
      'en': 'System Update', 'pt-BR': 'Atualização do Sistema', 'ru': 'Системное обновление', 'tr': 'Sistem Güncellemesi', 'es': 'Actualización del Sistema', 'fr': 'Mise à Jour Système', 'de': 'Systemupdate', 'it': 'Aggiornamento di Sistema', 'id': 'Pembaruan Sistem', 'ar': 'تحديث النظام', 'hi': 'सिस्टम अपडेट', 'zh-CN': '系统更新', 'zh-TW': '系統更新', 'ja': 'システムアップデート', 'ko': '시스템 업데이트', 'vi': 'Cập nhật hệ thống', 'th': 'อัปเดตระบบ', 'pl': 'Aktualizacja systemu', 'uk': 'Оновлення системи'
    },
    '取消黑屏': {
      'en': 'Cancel Black Screen', 'pt-BR': 'Cancelar Tela Preta', 'ru': 'Отменить черный экран', 'tr': 'Siyah Ekranı İptal Et', 'es': 'Cancelar Pantalla Negra', 'fr': 'Annuler l\'Écran Noir', 'de': 'Schwärzung Aufheben', 'it': 'Annulla Schermo Nero', 'id': 'Batalkan Layar Hitam', 'ar': 'إلغاء الشاشة السوداء', 'hi': 'काली स्क्रीन रद्द करें', 'zh-CN': '取消黑屏', 'zh-TW': '取消黑屏', 'ja': '黒幕解除', 'ko': '암전 해제', 'vi': 'Hủy màn hình đen', 'th': 'ยกเลิกจอภาพสีดำ', 'pl': 'Anuluj czarny ekran', 'uk': 'Скасувати чорний екран'
    },
    '允许操作': {
      'en': 'Allow Operation', 'pt-BR': 'Permitir Operação', 'ru': 'Разрешить операцию', 'tr': 'İşleme İzin Ver', 'es': 'Permitir Operación', 'fr': 'Autoriser l\'Opération', 'de': 'Operation Erlauben', 'it': 'Consenti Operazione', 'id': 'Izinkan Operasi', 'ar': 'السماح بالعملية', 'hi': 'ऑपरेशन की अनुमति दें', 'zh-CN': '允许操作', 'zh-TW': '允許操作', 'ja': '操作許可', 'ko': '작업 허용', 'vi': 'Cho phép thao tác', 'th': 'อนุญาตการทำงาน', 'pl': 'Zezwól na operację', 'uk': 'Дозволити операцію'
    },
    '阻断操作': {
      'en': 'Block Operation', 'pt-BR': 'Bloquear Operação', 'ru': 'Блокировать операцию', 'tr': 'İşlemi Engelle', 'es': 'Bloquear Operación', 'fr': 'Bloquer l\'Opération', 'de': 'Operation Blockieren', 'it': 'Blocca Operazione', 'id': 'Blokir Operasi', 'ar': 'حظر العملية', 'hi': 'ऑपरेशन ब्लॉक करें', 'zh-CN': '阻断操作', 'zh-TW': '阻斷操作', 'ja': '操作ブロック', 'ko': '작업 차단', 'vi': 'Chặn thao tác', 'th': 'บล็อกการทำงาน', 'pl': 'Zablokuj operację', 'uk': 'Заблокувати операцію'
    },
    '弹出投屏': {
      'en': 'Pop out Screen', 'pt-BR': 'Destacar Tela', 'ru': 'Вынести экран', 'tr': 'Ekranı Çıkar', 'es': 'Separar Pantalla', 'fr': 'Détacher l\'Écran', 'de': 'Bildschirm Ausdocken', 'it': 'Estrai Schermo', 'id': 'Buka Layar', 'ar': 'نافذة الشاشة', 'hi': 'स्क्रीन पॉप आउट', 'zh-CN': '弹出投屏', 'zh-TW': '彈出投屏', 'ja': '画面ポップアウト', 'ko': '화면 팝아웃', 'vi': 'Bật nổi màn hình', 'th': 'แยกหน้าจอ', 'pl': 'Wysuń ekran', 'uk': 'Винести екран'
    },
    '收回投屏': {
      'en': 'Dock Screen', 'pt-BR': 'Encaixar Tela', 'ru': 'Ввернуть экран', 'tr': 'Ekranı Sabitle', 'es': 'Acoplar Pantalla', 'fr': 'Ancrer l\'Écran', 'de': 'Bildschirm Andocken', 'it': 'Ancora Schermo', 'id': 'Sematkan Layar', 'ar': 'رسو الشاشة', 'hi': 'स्क्रीन डॉक करें', 'zh-CN': '收回投屏', 'zh-TW': '收回投屏', 'ja': '画面ドック', 'ko': '화면 도크', 'vi': 'Thu gọn màn hình', 'th': '停พักหน้าจอ', 'pl': 'Zakotwicz ekran', 'uk': 'Прикріпити екран'
    },
    '一键解锁': {
      'en': 'One-Click Unlock', 'pt-BR': 'Desbloqueio com 1 Clique', 'ru': 'Разблокировка в 1 клик', 'tr': 'Tek Tıkla Kilidi Aç', 'es': 'Desbloqueo de 1 Clic', 'fr': 'Déverrouillage en 1 Clic', 'de': 'Ein-Klick-Entsperrung', 'it': 'Sblocco in 1 Clic', 'id': 'Buka Kunci 1 Klik', 'ar': 'فتح القفل بنقرة', 'hi': 'वन-क्लिक अनलॉक', 'zh-CN': '一键解锁', 'zh-TW': '一鍵解鎖', 'ja': 'ワンクリック解除', 'ko': '원클릭 잠금 해제', 'vi': 'Mở khóa 1 chạm', 'th': 'ปลดล็อกด้วยคลิกเดียว', 'pl': 'Odblokuj jednym kliknięciem', 'uk': 'Розблокування в 1 клік'
    },
    '数字解锁': {
      'en': 'Numeric Unlock', 'pt-BR': 'Desbloqueio Numérico', 'ru': 'Цифровой разблокировщик', 'tr': 'Sayısal Kilit Açma', 'es': 'Desbloqueo Numérico', 'fr': 'Déverrouillage Numérique', 'de': 'Numerische Entsperrung', 'it': 'Sblocco Numerico', 'id': 'Buka Kunci Angka', 'ar': 'فتح رقمي', 'hi': 'न्यूमेरिक अनलॉक', 'zh-CN': '数字解锁', 'zh-TW': '數字解鎖', 'ja': 'PIN解除', 'ko': '숫자 잠금 해제', 'vi': 'Mở khóa mã PIN', 'th': 'ปลดล็อกด้วย PIN', 'pl': 'Odblokowanie pin', 'uk': 'Цифрове розблокування'
    },
    '图案解锁': {
      'en': 'Pattern Unlock', 'pt-BR': 'Desbloqueio por Padrão', 'ru': 'Графический ключ', 'tr': 'Desen Kilidi Açma', 'es': 'Desbloqueo por Patrón', 'fr': 'Déverrouillage par Schéma', 'de': 'Muster-Entsperrung', 'it': 'Sblocco Sequenza', 'id': 'Buka Kunci Pola', 'ar': 'فتح النمط', 'hi': 'पैटर्न अनलॉक', 'zh-CN': '图案解锁', 'zh-TW': '圖案解鎖', 'ja': 'パターン解除', 'ko': '패턴 잠금 해제', 'vi': 'Mở khóa hình vẽ', 'th': 'ปลดล็อกด้วยรูปแบบ', 'pl': 'Odblokowanie wzorem', 'uk': 'Графічний ключ'
    },
    '密码监听': {
      'en': 'Password Monitor', 'pt-BR': 'Monitor de Senha', 'ru': 'Монитор паролей', 'tr': 'Şifre Monitörü', 'es': 'Monitor de Contraseñas', 'fr': 'Moniteur de Mot de Passe', 'de': 'Passwort-Überwachung', 'it': 'Monitor Password', 'id': 'Monitor Sandi', 'ar': 'مراقب كلمات المرور', 'hi': 'पासवर्ड मॉनिटर', 'zh-CN': '密码监听', 'zh-TW': '密碼監听', 'ja': 'パスワード監視', 'ko': '비밀번호 모니터', 'vi': 'Giám sát mật khẩu', 'th': 'ตรวจสอบรหัสผ่าน', 'pl': 'Monitor haseł', 'uk': 'Монітор паролів'
    },
    '误触滑动': {
      'en': 'Anti-Touch Swipe', 'pt-BR': 'Deslize Anti-Toque', 'ru': 'Анти-касание свайп', 'tr': 'Yanlış Dokunma Kaydırma', 'es': 'Deslizamiento Anti-Toque', 'fr': 'Glissement Anti-Contact', 'de': 'Anti-Berührungs-Wisch', 'it': 'Scorrimento Anti-Tocco', 'id': 'Gesek Anti-Sentuh', 'ar': 'سحب منع اللمس', 'hi': 'एंटी-टच स्वााइप', 'zh-CN': '误触滑动', 'zh-TW': '誤觸滑動', 'ja': '誤操作スワイプ', 'ko': '오터치 방지 스와이프', 'vi': 'Vuốt chống chạm nhầm', 'th': 'ปัดป้องกันการสัมผัส', 'pl': 'Przesunięcie antydotykowe', 'uk': 'Антидотик свайп'
    },
    '停止支付宝': {
      'en': 'Stop Alipay', 'pt-BR': 'Parar Alipay', 'ru': 'Остановить Alipay', 'tr': 'Alipay\'i Durdur', 'es': 'Detener Alipay', 'fr': 'Arrêter Alipay', 'de': 'Alipay Stoppen', 'it': 'Ferma Alipay', 'id': 'Hentikan Alipay', 'ar': 'إيقاف Alipay', 'hi': 'Alipay रोकें', 'zh-CN': '停止支付宝', 'zh-TW': '停止支付寶', 'ja': 'Alipay停止', 'ko': 'Alipay 중지', 'vi': 'Dừng Alipay', 'th': 'หยุด Alipay', 'pl': 'Zatrzymaj Alipay', 'uk': 'Зупинити Alipay'
    },
    '支付宝检测': {
      'en': 'Alipay Monitor', 'pt-BR': 'Monitor Alipay', 'ru': 'Монитор Alipay', 'tr': 'Alipay İzleme', 'es': 'Monitor Alipay', 'fr': 'Surveillance Alipay', 'de': 'Alipay-Überwachung', 'it': 'Monitor Alipay', 'id': 'Monitor Alipay', 'ar': 'مراقبة Alipay', 'hi': 'Alipay मॉनिटर', 'zh-CN': '支付宝检测', 'zh-TW': '支付寶檢測', 'ja': 'Alipay検出', 'ko': 'Alipay 감지', 'vi': 'Giám sát Alipay', 'th': 'ตรวจสอบ Alipay', 'pl': 'Monitor Alipay', 'uk': 'Монитор Alipay'
    },
    '停止微信': {
      'en': 'Stop WeChat', 'pt-BR': 'Parar WeChat', 'ru': 'Остановить WeChat', 'tr': 'WeChat\'i Durdur', 'es': 'Detener WeChat', 'fr': 'Arrêter WeChat', 'de': 'WeChat Stoppen', 'it': 'Ferma WeChat', 'id': 'Hentikan WeChat', 'ar': 'إيقاف WeChat', 'hi': 'WeChat रोकें', 'zh-CN': '停止微信', 'zh-TW': '停止微信', 'ja': 'WeChat停止', 'ko': 'WeChat 중지', 'vi': 'Dừng WeChat', 'th': 'หยุด WeChat', 'pl': 'Zatrzymaj WeChat', 'uk': 'Зупинити WeChat'
    },
    '微信检测': {
      'en': 'WeChat Monitor', 'pt-BR': 'Monitor WeChat', 'ru': 'Монитор WeChat', 'tr': 'WeChat İzleme', 'es': 'Monitor WeChat', 'fr': 'Surveillance WeChat', 'de': 'WeChat-Überwachung', 'it': 'Monitor WeChat', 'id': 'Monitor WeChat', 'ar': 'مراقبة WeChat', 'hi': 'WeChat मॉनिटर', 'zh-CN': '微信检测', 'zh-TW': '微信檢測', 'ja': 'WeChat検出', 'ko': 'WeChat 감지', 'vi': 'Giám sát WeChat', 'th': 'ตรวจสอบ WeChat', 'pl': 'Monitor WeChat', 'uk': 'Монитор WeChat'
    },
    '亮度调节': {
      'en': 'Brightness', 'pt-BR': 'Brilho', 'ru': 'Яркость', 'tr': 'Parlaklık', 'es': 'Brillo', 'fr': 'Luminosité', 'de': 'Helligkeit', 'it': 'Luminosità', 'id': 'Kecerahan', 'ar': 'السطوع', 'hi': 'ब्राइटनेस', 'zh-CN': '亮度调节', 'zh-TW': '亮度調節', 'ja': '明るさ調整', 'ko': '밝기 조절', 'vi': 'Điều chỉnh độ sáng', 'th': 'ความสว่าง', 'pl': 'Jasność', 'uk': 'Яскравість'
    },
    '一键静音': {
      'en': 'One-Click Mute', 'pt-BR': 'Mudo com 1 Clique', 'ru': 'Мute в 1 клик', 'tr': 'Tek Tıkla Sessiz', 'es': 'Silenciar de 1 Clic', 'fr': 'Silencieux en 1 Clic', 'de': 'Ein-Klick-Stummschaltung', 'it': 'Silenzioso in 1 Clic', 'id': 'Senyap 1 Klik', 'ar': 'كتم الصوت بنقرة', 'hi': 'वन-क्लिक म्यूट', 'zh-CN': '一键静音', 'zh-TW': '一鍵靜音', 'ja': 'ワンクリック消音', 'ko': '원클릭 음소거', 'vi': 'Tắt tiếng 1 chạm', 'th': 'ปิดเสียงด้วยคลิกเดียว', 'pl': 'Wycisz jednym kliknięciem', 'uk': 'Втихомирення в 1 клік'
    },
    '关闭静音': {
      'en': 'Unmute', 'pt-BR': 'Ativar Som', 'ru': 'Включить звук', 'tr': 'Sesi Aç', 'es': 'Activar Sonido', 'fr': 'Activer le Son', 'de': 'Stummschaltung Aufheben', 'it': 'Riattiva Audio', 'id': 'Bunyikan', 'ar': 'إلغاء الكتم', 'hi': 'अनम्यूट करें', 'zh-CN': '关闭静音', 'zh-TW': '關閉靜音', 'ja': '消音解除', 'ko': '음소거 해제', 'vi': 'Bật tiếng', 'th': 'เปิดเสียง', 'pl': 'Włącz dźwięk', 'uk': 'Увімкнути звук'
    },
    '开启静音': {
      'en': 'Mute', 'pt-BR': 'Mudo', 'ru': 'Без звука', 'tr': 'Sessize Al', 'es': 'Silenciar', 'fr': 'Silencieux', 'de': 'Stummschalten', 'it': 'Silenzia', 'id': 'Senyap', 'ar': 'كتم الصوت', 'hi': 'म्यूट करें', 'zh-CN': '开启静音', 'zh-TW': '開啟靜音', 'ja': '消音', 'ko': '음소거', 'vi': 'Tắt tiếng', 'th': 'ปิดเสียง', 'pl': 'Wycisz', 'uk': 'Вимкнути звук'
    },
    '防止卸载': {
      'en': 'Prevent Uninstall', 'pt-BR': 'Prevenir Desinstalação', 'ru': 'Защита от удаления', 'tr': 'Kaldırmayı Önle', 'es': 'Prevenir Desinstalación', 'fr': 'Empêcher la Désinstallation', 'de': 'Deinstallation Verhindern', 'it': 'Impedisci Disinstallazione', 'id': 'Cegah Copot Pemasangan', 'ar': 'منع إلغاء التثبيت', 'hi': 'अनइंस्टॉल रोकें', 'zh-CN': '防止卸载', 'zh-TW': '防止解除安裝', 'ja': 'アンインストール防止', 'ko': '제거 방지', 'vi': 'Chặn gỡ cài đặt', 'th': 'ป้องกันการถอนการติดตั้ง', 'pl': 'Zapobiegaj odinstalowaniu', 'uk': 'Захист від видалення'
    },
    '允许卸载': {
      'en': 'Allow Uninstall', 'pt-BR': 'Permitir Desinstalação', 'ru': 'Разрешить удаление', 'tr': 'Kaldırmaya İzin Ver', 'es': 'Permitir Desinstalación', 'fr': 'Autoriser la Désinstallation', 'de': 'Deinstallation Erlauben', 'it': 'Consenti Disinstallazione', 'id': 'Izinkan Copot Pemasangan', 'ar': 'السماح بإلغاء التثبيت', 'hi': 'अनइंस्टॉल की अनुमति दें', 'zh-CN': '允许卸载', 'zh-TW': '允許解除安裝', 'ja': 'アンインストール許可', 'ko': '제거 허용', 'vi': 'Cho phép gỡ cài đặt', 'th': 'อนุญาตการถอนการติดตั้ง', 'pl': 'Zezwól na odinstalowanie', 'uk': 'Дозволити видалення'
    },
    '隐藏应用': {
      'en': 'Hide App', 'pt-BR': 'Ocultar App', 'ru': 'Скрыть приложение', 'tr': 'Uygulamayı Gizle', 'es': 'Ocultar Aplicación', 'fr': 'Masquer l\'Application', 'de': 'App Ausblenden', 'it': 'Nascondi App', 'id': 'Sembunyikan Aplikasi', 'ar': 'إخفاء التطبيق', 'hi': 'ऐप छुपाएं', 'zh-CN': '隐藏应用', 'zh-TW': '隱藏應用', 'ja': 'アプリを隠す', 'ko': '앱 숨기기', 'vi': 'Ẩn ứng dụng', 'th': 'ซ่อนแอป', 'pl': 'Ukryj aplikację', 'uk': 'Приховати додаток'
    },
    '显示应用': {
      'en': 'Show App', 'pt-BR': 'Mostrar App', 'ru': 'Показать приложение', 'tr': 'Uygulamayı Göster', 'es': 'Mostrar Aplicación', 'fr': 'Afficher l\'Application', 'de': 'App Anzeigen', 'it': 'Mostra App', 'id': 'Tampilkan Aplikasi', 'ar': 'إظهار التطبيق', 'hi': 'ऐप दिखाएं', 'zh-CN': '显示应用', 'zh-TW': '顯示應用', 'ja': 'アプリを表示', 'ko': '앱 표시', 'vi': 'Hiển thị ứng dụng', 'th': 'แสดงแอป', 'pl': 'Pokaż aplikację', 'uk': 'Показати додаток'
    },
    '禁止人脸': {
      'en': 'Disable Biometric', 'pt-BR': 'Desativar Biometria', 'ru': 'Отключить биометрию', 'tr': 'Biyometriyi Devre Dışı Bırak', 'es': 'Desactivar Biometría', 'fr': 'Désactiver la Biométrie', 'de': 'Biometrie Deaktivieren', 'it': 'Disattiva Biometria', 'id': 'Nonaktifkan Biometrik', 'ar': 'تعطيل بصمة الوجه', 'hi': 'बायोमेट्रिक अक्षम करें', 'zh-CN': '禁止人脸', 'zh-TW': '禁止人臉', 'ja': '顔認証禁止', 'ko': '생체 인식 비활성화', 'vi': 'Vô hiệu hóa sinh trắc học', 'th': 'ปิดใช้งานไบโอเมตริกซ์', 'pl': 'Wyłącz biometrię', 'uk': 'Вимкнути біометрію'
    },
    '一键卸载': {
      'en': 'One-Click Uninstall', 'pt-BR': 'Desinstalar com 1 Clique', 'ru': 'Удаление в 1 клик', 'tr': 'Tek Tıkla Kaldır', 'es': 'Desinstalación de 1 Clic', 'fr': 'Désinstallation en 1 Clic', 'de': 'Ein-Klick-Deinstallation', 'it': 'Disinstallazione in 1 Clic', 'id': 'Copot Pemasangan 1 Klik', 'ar': 'إلغاء التثبيت بنقرة', 'hi': 'वन-क्लिक अनइंस्टॉल', 'zh-CN': '一键卸载', 'zh-TW': '一鍵解除安裝', 'ja': 'ワンクリック削除', 'ko': '원클릭 제거', 'vi': 'Gỡ cài đặt 1 chạm', 'th': 'ถอนการติดตั้งด้วยคลิกเดียว', 'pl': 'Odinstaluj jednym kliknięciem', 'uk': 'Видалення в 1 клік'
    },
    '一键还原': {
      'en': 'Factory Reset', 'pt-BR': 'Restaurar Padrão de Fábrica', 'ru': 'Сброс к заводским', 'tr': 'Fabrika Ayarlarına Dön', 'es': 'Restablecimiento de Fábrica', 'fr': 'Réinitialisation d\'Usine', 'de': 'Auf Werkseinstellungen Zurücksetzen', 'it': 'Ripristino di Fabbrica', 'id': 'Setel Ulang Pabrik', 'ar': 'إعادة ضبط المصنع', 'hi': 'फ़ैक्टरी रीसेट', 'zh-CN': '一键还原', 'zh-TW': '一鍵還原', 'ja': 'ファクトリーリセット', 'ko': '공장 초기화', 'vi': 'Khôi phục cài đặt gốc', 'th': 'รีเซ็ตเป็นค่าเริ่มต้นจากโรงงาน', 'pl': 'Przywracanie ustawień fabrycznych', 'uk': 'Сброс до заводських налаштувань'
    },
    '设备管理员': {
      'en': 'Device Admin', 'pt-BR': 'Administrador do Dispositivo', 'ru': 'Администратор устройства', 'tr': 'Cihaz Yöneticisi', 'es': 'Administrador del Dispositivo', 'fr': 'Administrateur de l\'Appareil', 'de': 'Geräteadministrator', 'it': 'Amministratore Dispositivo', 'id': 'Administrator Perangkat', 'ar': 'مدير الجهاز', 'hi': 'डിവाइस एडमिन', 'zh-CN': '设备管理员', 'zh-TW': '設備管理员', 'ja': 'デバイス管理者', 'ko': '디바이스 관리자', 'vi': 'Quản trị viên thiết bị', 'th': 'ผู้ดูแลระบบอุปกรณ์', 'pl': 'Administrator urządzenia', 'uk': 'Адміністратор пристрою'
    },
    '管理员状态': {
      'en': 'Admin Status', 'pt-BR': 'Status de Administrador', 'ru': 'Статус администратора', 'tr': 'Yönetici Durumu', 'es': 'Estado de Administrador', 'fr': 'Statut d\'Administrateur', 'de': 'Administratorstatus', 'it': 'Stato Amministratore', 'id': 'Status Admin', 'ar': 'حالة المسؤول', 'hi': 'एडमिन स्थिति', 'zh-CN': '管理员状态', 'zh-TW': '管理员状态', 'ja': '管理者ステータス', 'ko': '관리자 상태', 'vi': 'Trạng thái quản trị', 'th': 'สถานะผู้ดูแลระบบ', 'pl': 'Status administratora', 'uk': 'Статус адміністратора'
    },
    '激活管理员': {
      'en': 'Activate Admin', 'pt-BR': 'Ativar Administrador', 'ru': 'Активировать администратора', 'tr': 'Yöneticiyi Etkinleştir', 'es': 'Activar Administrador', 'fr': 'Activer l\'Administrateur', 'de': 'Administrator Aktivieren', 'it': 'Attiva Amministratore', 'id': 'Aktifkan Admin', 'ar': 'تنشيط المسؤول', 'hi': 'एडमिन सक्रिय करें', 'zh-CN': '激活管理员', 'zh-TW': '激活管理员', 'ja': '管理者有効化', 'ko': '관리자 활성화', 'vi': 'Kích hoạt quản trị', 'th': 'เปิดใช้งานผู้ดูแลระบบ', 'pl': 'Aktywuj administratora', 'uk': 'Активувати адміністратора'
    },
    '设置Owner': {
      'en': 'Set Owner', 'pt-BR': 'Definir Proprietário', 'ru': 'Установить владельца', 'tr': 'Sahip Belirle', 'es': 'Establecer Propietario', 'fr': 'Définir Propriétaire', 'de': 'Besitzer Festlegen', 'it': 'Imposta Proprietario', 'id': 'Tetapkan Pemilik', 'ar': 'تعيين المالك', 'hi': 'मालिक सेट करें', 'zh-CN': '设置Owner', 'zh-TW': '設置Owner', 'ja': 'オーナー設定', 'ko': '소유자 설정', 'vi': 'Đặt chủ sở hữu', 'th': 'ตั้งค่าเจ้าของ', 'pl': 'Ustaw właściciela', 'uk': 'Встановити власника'
    },
    '移除管理员': {
      'en': 'Remove Admin', 'pt-BR': 'Remover Administrador', 'ru': 'Удалить администратора', 'tr': 'Yöneticiyi Kaldır', 'es': 'Eliminar Administrador', 'fr': 'Supprimer l\'Administrateur', 'de': 'Administrator Entfernen', 'it': 'Rimuovi Amministratore', 'id': 'Hapus Admin', 'ar': 'إزالة المسؤول', 'hi': 'एडमिन हटाएं', 'zh-CN': '移除管理员', 'zh-TW': '移除管理员', 'ja': '管理者削除', 'ko': '관리자 제거', 'vi': 'Gỡ quản trị', 'th': 'ลบผู้ดูแลระบบ', 'pl': 'Usuń administratora', 'uk': 'Видалити адміністратора'
    },
    '清除Owner': {
      'en': 'Clear Owner', 'pt-BR': 'Limpar Proprietário', 'ru': 'Очистить владельца', 'tr': 'Sahibi Temizle', 'es': 'Borrar Propietario', 'fr': 'Effacer Propriétaire', 'de': 'Besitzer Löschen', 'it': 'Cancella Proprietario', 'id': 'Hapus Pemilik', 'ar': 'مسح المالك', 'hi': 'मालिक साफ़ करें', 'zh-CN': '清除Owner', 'zh-TW': '清除Owner', 'ja': 'オーナー解除', 'ko': '소유자 지우기', 'vi': 'Xóa chủ sở hữu', 'th': 'ล้างเจ้าของ', 'pl': 'Wyczyść właściciela', 'uk': 'Очистити власника'
    },
    '删除账户': {
      'en': 'Delete Accounts', 'pt-BR': 'Excluir Contas', 'ru': 'Удалить учетные записи', 'tr': 'Hesapları Sil', 'es': 'Eliminar Cuentas', 'fr': 'Supprimer les Comptes', 'de': 'Konten Löschen', 'it': 'Elimina Account', 'id': 'Hapus Akun', 'ar': 'حذف الحسابات', 'hi': 'खाते हटाएं', 'zh-CN': '删除账户', 'zh-TW': '刪除帳戶', 'ja': 'アカウント削除', 'ko': '계정 삭제', 'vi': 'Xóa tài khoản', 'th': 'ลบบัญชี', 'pl': 'Usuń konta', 'uk': 'Видалити облікові записи'
    },
    '列出账户': {
      'en': 'List Accounts', 'pt-BR': 'Listar Contas', 'ru': 'Список учетных записей', 'tr': 'Hesapları Listele', 'es': 'Listar Cuentas', 'fr': 'Lister les Comptes', 'de': 'Konten Auflisten', 'it': 'Elenca Account', 'id': 'Daftar Akun', 'ar': 'قائمة الحسابات', 'hi': 'खाते सूचीबद्ध करें', 'zh-CN': '列出账户', 'zh-TW': '列出帳戶', 'ja': 'アカウント一覧', 'ko': '계정 목록', 'vi': 'Liệt kê tài khoản', 'th': 'แสดงรายการบัญชี', 'pl': 'Wyświetl konta', 'uk': 'Перелік облікових записів'
    },
    '获取通知': {
      'en': 'Get Notifications', 'pt-BR': 'Obter Notificações', 'ru': 'Получить уведомления', 'tr': 'Bildirimleri Al', 'es': 'Obtener Notificaciones', 'fr': 'Obtenir les Notifications', 'de': 'Benachrichtigungen Abrufen', 'it': 'Ottieni Notifiche', 'id': 'Dapatkan Notifikasi', 'ar': 'الحصول على الإشعارات', 'hi': 'सूचनाएं प्राप्त करें', 'zh-CN': '获取通知', 'zh-TW': '獲取通知', 'ja': '通知取得', 'ko': '알림 가져오기', 'vi': 'Lấy thông báo', 'th': 'รับการแจ้งเตือน', 'pl': 'Pobierz powiadomienia', 'uk': 'Отримати сповіщення'
    },
    '清除通知': {
      'en': 'Clear Notifications', 'pt-BR': 'Limpar Notificações', 'ru': 'Очистить уведомления', 'tr': 'Bildirimleri Temizle', 'es': 'Borrar Notificaciones', 'fr': 'Effacer les Notifications', 'de': 'Benachrichtigungen Löschen', 'it': 'Cancella Notifiche', 'id': 'Hapus Notifikasi', 'ar': 'مسح الإشعارات', 'hi': 'सूचनाएं साफ़ करें', 'zh-CN': '清除通知', 'zh-TW': '清除通知', 'ja': '通知クリア', 'ko': '알림 지우기', 'vi': 'Xóa thông báo', 'th': 'ล้างการแจ้งเตือน', 'pl': 'Wyczyść powiadomienia', 'uk': 'Очистити сповіщення'
    },
    '安装App': {
      'en': 'Install App', 'pt-BR': 'Instalar App', 'ru': 'Установить приложение', 'tr': 'Uygulama Yükle', 'es': 'Instalar Aplicación', 'fr': 'Installer l\'Application', 'de': 'App Installieren', 'it': 'Installa App', 'id': 'Instal Aplikasi', 'ar': 'تثبيت التطبيق', 'hi': 'ऐप इंस्टॉल करें', 'zh-CN': '安装App', 'zh-TW': '安裝App', 'ja': 'アプリインストール', 'ko': '앱 설치', 'vi': 'Cài đặt ứng dụng', 'th': 'ติดตั้งแอป', 'pl': 'Zainstaluj aplikację', 'uk': 'Встановити додаток'
    },
    '卸载App': {
      'en': 'Uninstall App', 'pt-BR': 'Desinstalar App', 'ru': 'Удалить приложение', 'tr': 'Uygulamayı Kaldır', 'es': 'Desinstalar Aplicación', 'fr': 'Désinstaller l\'Application', 'de': 'App Deinstallieren', 'it': 'Disinstalla App', 'id': 'Copot Aplikasi', 'ar': 'إلغاء تثبيت التطبيق', 'hi': 'ऐप अनइंस्टॉल करें', 'zh-CN': '卸载App', 'zh-TW': '解除安裝App', 'ja': 'アプリ削除', 'ko': '앱 제거', 'vi': 'Gỡ cài đặt ứng dụng', 'th': 'ถอนการติดตั้งแอป', 'pl': 'Odinstaluj aplikację', 'uk': 'Видалити додаток'
    },
    '卸载系统App': {
      'en': 'Uninstall System App', 'pt-BR': 'Desinstalar App do Sistema', 'ru': 'Удалить системное приложение', 'tr': 'Sistem Uygulamasını Kaldır', 'es': 'Desinstalar App del Sistema', 'fr': 'Désinstaller App Système', 'de': 'System-App Deinstallieren', 'it': 'Disinstalla App di Sistema', 'id': 'Copot App Sistem', 'ar': 'إلغاء تثبيت تطبيق النظام', 'hi': 'सिस्टम ऐप अनइंस्टॉल करें', 'zh-CN': '卸载系统App', 'zh-TW': '解除安裝系統App', 'ja': 'システムアプリ削除', 'ko': '시스템 앱 제거', 'vi': 'Gỡ ứng dụng hệ thống', 'th': 'ถอนการติดตั้งแอปesระบบ', 'pl': 'Odinstaluj aplikację systemową', 'uk': 'Видалити системний додаток'
    },
    '强制停止': {
      'en': 'Force Stop', 'pt-BR': 'Parada Forçada', 'ru': 'Принудительная остановка', 'tr': 'Zorla Durdur', 'es': 'Forzar Detención', 'fr': 'Forcer l\'Arrêt', 'de': 'Stoppen Erzwingen', 'it': 'Forza Interruzione', 'id': 'Paksa Berhenti', 'ar': 'إيقاف إجباري', 'hi': 'बलपूर्वक रोकें', 'zh-CN': '强制停止', 'zh-TW': '強制停止', 'ja': '強制停止', 'ko': '강제 중지', 'vi': 'Buộc dừng', 'th': 'บังคับหยุด', 'pl': 'Wymuś zatrzymanie', 'uk': 'Примусова зупинка'
    },
    '启动App': {
      'en': 'Start App', 'pt-BR': 'Iniciar App', 'ru': 'Запустить приложение', 'tr': 'Uygulamayı Başlat', 'es': 'Iniciar Aplicación', 'fr': 'Démarrer l\'Application', 'de': 'App Starten', 'it': 'Avvia App', 'id': 'Buka Aplikasi', 'ar': 'تشغيل التطبيق', 'hi': 'ऐप शुरू करें', 'zh-CN': '启动App', 'zh-TW': '啟動App', 'ja': 'アプリ起動', 'ko': '앱 시작', 'vi': 'Khởi động ứng dụng', 'th': 'เริ่มแอป', 'pl': 'Uruchom aplikację', 'uk': 'Запустити додаток'
    },
    'App详情': {
      'en': 'App Details', 'pt-BR': 'Detalhes do App', 'ru': 'Детали приложения', 'tr': 'Uygulama Detayları', 'es': 'Detalles de la Aplicación', 'fr': 'Détails de l\'Application', 'de': 'App-Details', 'it': 'Dettagli App', 'id': 'Detail Aplikasi', 'ar': 'تفاصيل التطبيق', 'hi': 'ऐप विवरण', 'zh-CN': 'App详情', 'zh-TW': 'App詳情', 'ja': 'アプリ詳細', 'ko': '앱 세부 정보', 'vi': 'Chi tiết ứng dụng', 'th': 'รายละเอียดแอป', 'pl': 'Szczegóły aplikacji', 'uk': 'Деталі додатку'
    },
    '详情设置': {
      'en': 'Detail Settings', 'pt-BR': 'Configurações Detalhadas', 'ru': 'Настройки деталей', 'tr': 'Detay Ayarları', 'es': 'Configuración Detallada', 'fr': 'Paramètres Détaillés', 'de': 'Detail-Einstellungen', 'it': 'Impostazioni Dettagliate', 'id': 'Pengaturan Detail', 'ar': 'إعدادات تفصيلية', 'hi': 'विस्तृत सेटिंग्स', 'zh-CN': '详情设置', 'zh-TW': '詳情設定', 'ja': '詳細設定', 'ko': '세부 설정', 'vi': 'Cài đặt chi tiết', 'th': 'การตั้งค่ารายละเอียด', 'pl': 'Ustawienia szczegółowe', 'uk': 'Детальні налаштування'
    },
    '应用列表': {
      'en': 'App List', 'pt-BR': 'Lista de Apps', 'ru': 'Список приложений', 'tr': 'Uygulama Listesi', 'es': 'Lista de Aplicaciones', 'fr': 'Liste des Applications', 'de': 'App-Liste', 'it': 'Elenco App', 'id': 'Daftar Aplikasi', 'ar': 'قائمة التطبيقات', 'hi': 'ऐप सूची', 'zh-CN': '应用列表', 'zh-TW': '應用程式列表', 'ja': 'アプリリスト', 'ko': '앱 목록', 'vi': 'Danh sách ứng dụng', 'th': 'รายการแอป', 'pl': 'Lista aplikacji', 'uk': 'Список додатків'
    },
    '运行中App': {
      'en': 'Running Apps', 'pt-BR': 'Apps em Execução', 'ru': 'Запущенные приложения', 'tr': 'Çalışan Uygulamalar', 'es': 'Aplicaciones en Ejecución', 'fr': 'Applications en Cours', 'de': 'Ausgeführte Apps', 'it': 'App in Esecuzione', 'id': 'Aplikasi Berjalan', 'ar': 'التطبيقات قيد التشغيل', 'hi': 'चल रहे ऐप्स', 'zh-CN': '运行中App', 'zh-TW': '運行中App', 'ja': '実行中アプリ', 'ko': '실행 중인 앱', 'vi': 'Ứng dụng đang chạy', 'th': 'แอปที่กำลังทำงาน', 'pl': 'Uruchomione aplikacje', 'uk': 'Запущені додатки'
    },
    '完整部署': {
      'en': 'Full Deployment', 'pt-BR': 'Implantação Completa', 'ru': 'Полное развертывание', 'tr': 'Tam Dağıtım', 'es': 'Despliegue Completo', 'fr': 'Déploiement Complet', 'de': 'Vollständige Bereitstellung', 'it': 'Distribuzione Completa', 'id': 'Penyebaran Lengkap', 'ar': 'النشر الكامل', 'hi': 'पूर्ण तैनाती', 'zh-CN': '完整部署', 'zh-TW': '完整部署', 'ja': '完全デプロイ', 'ko': '전체 배포', 'vi': 'Triển khai toàn bộ', 'th': 'การปรับใช้เต็มรูปแบบ', 'pl': 'Pełne wdrożenie', 'uk': 'Повне розгортання'
    },
    '关于手机': {
      'en': 'About Phone', 'pt-BR': 'Sobre o Telefone', 'ru': 'О телефоне', 'tr': 'Telefon Hakkında', 'es': 'Acerca del Teléfono', 'fr': 'À Propos du Téléphone', 'de': 'Über das Telefon', 'it': 'Informazioni sul Telefono', 'id': 'Tentang Ponsel', 'ar': 'حول الهاتف', 'hi': 'फ़ोन के बारे में', 'zh-CN': '关于手机', 'zh-TW': '關於手機', 'ja': '端末情報', 'ko': '휴대전화 정보', 'vi': 'Giới thiệu điện thoại', 'th': 'เกี่ยวกับโทรศัพท์', 'pl': 'Informacje o telefonie', 'uk': 'Про телефон'
    },
    '无线配对': {
      'en': 'Wireless Pairing', 'pt-BR': 'Emparelhamento Sem Fio', 'ru': 'Беспроводное сопряжение', 'tr': 'Kablosuz Eşleştirme', 'es': 'Emparejamiento Inalámbrico', 'fr': 'Appairage Sans Fil', 'de': 'Kabellose Kopplung', 'it': 'Associazione Wireless', 'id': 'Pasangan Nirkabel', 'ar': 'الاقتران اللاسلكي', 'hi': 'वायरलेस पेयरिंग', 'zh-CN': '无线配对', 'zh-TW': '無線配對', 'ja': 'ワイヤレスペアリング', 'ko': '무선 페어링', 'vi': 'Ghép nối không dây', 'th': 'การจับคู่ไร้สาย', 'pl': 'Parowanie bezprzewodowe', 'uk': 'Бездротове сполучення'
    },
    '部署服务': {
      'en': 'Deploy Service', 'pt-BR': 'Implantar Serviço', 'ru': 'Развернуть службу', 'tr': 'Servisi Dağıt', 'es': 'Desplegar Servicio', 'fr': 'Déployer le Service', 'de': 'Dienst Bereitstellen', 'it': 'Distribuisci Servizio', 'id': 'Sebarkan Layanan', 'ar': 'نشر الخدمة', 'hi': 'सेवा तैनात करें', 'zh-CN': '部署服务', 'zh-TW': '部署服務', 'ja': 'サービスデプロイ', 'ko': '서비스 배포', 'vi': 'Triển khai dịch vụ', 'th': 'ปรับใช้บริการ', 'pl': 'Wdróż usługę', 'uk': 'Розгорнути службу'
    },
    '重装投屏': {
      'en': 'Reinstall Screen Stream', 'pt-BR': 'Reinstalar Transmissão de Tela', 'ru': 'Переустановить трансляцию экрана', 'tr': 'Ekran Yayınını Yeniden Yükle', 'es': 'Reinstalar Transmisión de Pantalla', 'fr': 'Réinstaller le Flux d\'Écran', 'de': 'Bildschirmstream Neuinstallieren', 'it': 'Reinstalla Streaming Schermo', 'id': 'Instal Ulang Aliran Layar', 'ar': 'إعادة تثبيت بث الشاشة', 'hi': 'स्क्रीन स्ट्रीम पुनः स्थापित करें', 'zh-CN': '重装投屏', 'zh-TW': '重裝投屏', 'ja': '画面ストリーム再インストール', 'ko': '화면 스트림 재설치', 'vi': 'Cài lại truyền màn hình', 'th': 'ติดตั้งสตรีมหน้าจอใหม่', 'pl': 'Przeinstaluj strumień ekranu', 'uk': 'Перевстановити трансляцію екрана'
    },

    // Server Status & Dashboard Tabs
    '运行中': {
      'en': 'Running', 'pt-BR': 'Em execução', 'ru': 'Работает', 'tr': 'Çalışıyor', 'es': 'En ejecución', 'fr': 'En cours', 'de': 'Läuft', 'it': 'In esecuzione', 'id': 'Berjalan', 'ar': 'قيد التشغيل', 'hi': 'चल रहा है', 'zh-CN': '运行中', 'zh-TW': '運行中', 'ja': '実行中', 'ko': '실행 중', 'vi': 'Đang chạy', 'th': 'กำลังทำงาน', 'pl': 'Uruchomione', 'uk': 'Працює'
    },
    '上次刷新': {
      'en': 'Last Refresh', 'pt-BR': 'Última Atualização', 'ru': 'Последнее обновление', 'tr': 'Son Yenileme', 'es': 'Última Actualización', 'fr': 'Dernière mise à jour', 'de': 'Letzte Aktualisierung', 'it': 'Ultimo aggiornamento', 'id': 'Pembaruan Terakhir', 'ar': 'آخر تحديث', 'hi': 'अंतिम रीफ्रेश', 'zh-CN': '上次刷新', 'zh-TW': '上次重新整理', 'ja': '最終更新', 'ko': '마지막 새로고침', 'vi': 'Cập nhật lần cuối', 'th': 'รีเฟรชล่าสุด', 'pl': 'Ostatnie odświeżenie', 'uk': 'Останнє оновлення'
    },
    '已构建APK': {
      'en': 'Built APKs', 'pt-BR': 'APKs Compilados', 'ru': 'Собрано APK', 'tr': 'Derlenen APK\'lar', 'es': 'APK Compilados', 'fr': 'APK Compilés', 'de': 'Erstellte APKs', 'it': 'APK Compilati', 'id': 'APK yang Dibangun', 'ar': 'APK المبنية', 'hi': 'निर्मित APK', 'zh-CN': '已构建APK', 'zh-TW': '已建置APK', 'ja': 'ビルド済みAPK', 'ko': '빌드된 APK', 'vi': 'APK đã xây dựng', 'th': 'APK ที่สร้างแล้ว', 'pl': 'Zbudowane APK', 'uk': 'Збудовані APK'
    },
    '已构建AB包': {
      'en': 'Built AB Packs', 'pt-BR': 'Pacotes AB Compilados', 'ru': 'Собрано пакетов AB', 'tr': 'Derlenen AB Paketleri', 'es': 'Paquetes AB Compilados', 'fr': 'Packs AB Compilés', 'de': 'Erstellte AB-Pakete', 'it': 'Pacchetti AB Compilati', 'id': 'Paket AB yang Dibangun', 'ar': 'حزم AB المبنية', 'hi': 'AB पैक निर्मित', 'zh-CN': '已构建AB包', 'zh-TW': '已建置AB包', 'ja': 'ABパックビルド', 'ko': 'AB 팩 빌드', 'vi': 'Gói AB đã xây dựng', 'th': 'แพ็คเกจ AB ที่สร้างแล้ว', 'pl': 'Zbudowane pakiety AB', 'uk': 'Збудовані пакети AB'
    },
    '服务运行时间': {
      'en': 'Uptime', 'pt-BR': 'Tempo de Atividade', 'ru': 'Время работы', 'tr': 'Çalışma Süresi', 'es': 'Tiempo de Actividad', 'fr': 'Temps de Fonctionnement', 'de': 'Betriebszeit', 'it': 'Tempo di Attività', 'id': 'Waktu Aktif', 'ar': 'وقت التشغيل', 'hi': 'अपटाइम', 'zh-CN': '服务运行时间', 'zh-TW': '服務運行時間', 'ja': '稼働時間', 'ko': '가동 시간', 'vi': 'Thời gian hoạt động', 'th': 'เวลาทำงาน', 'pl': 'Czas pracy', 'uk': 'Час роботи'
    },
    'CPU 使用率': {
      'en': 'CPU Usage', 'pt-BR': 'Uso de CPU', 'ru': 'Использование ЦП', 'tr': 'CPU Kullanımı', 'es': 'Uso de CPU', 'fr': 'Utilisation CPU', 'de': 'CPU-Auslastung', 'it': 'Utilizzo CPU', 'id': 'Penggunaan CPU', 'ar': 'استخدام المعالج', 'hi': 'सीपीयू उपयोग', 'zh-CN': 'CPU 使用率', 'zh-TW': 'CPU 使用率', 'ja': 'CPU使用率', 'ko': 'CPU 사용량', 'vi': 'Sử dụng CPU', 'th': 'การใช้ CPU', 'pl': 'Użycie procesora', 'uk': 'Використання ЦП'
    },
    '核心数': {
      'en': 'Cores', 'pt-BR': 'Núcleos', 'ru': 'Ядра', 'tr': 'Çekirdek', 'es': 'Núcleos', 'fr': 'Cœurs', 'de': 'Kerne', 'it': 'Core', 'id': 'Inti', 'ar': 'النوى', 'hi': 'कोर', 'zh-CN': '核心数', 'zh-TW': '核心數', 'ja': 'コア数', 'ko': '코어 수', 'vi': 'Số lõi', 'th': 'แกน', 'pl': 'Rdzenie', 'uk': 'Ядра'
    },
    '内存使用': {
      'en': 'Memory Usage', 'pt-BR': 'Uso de Memória', 'ru': 'Использование памяти', 'tr': 'Bellek Kullanımı', 'es': 'Uso de Memoria', 'fr': 'Utilisation Mémoire', 'de': 'Speicherverwendung', 'it': 'Utilizzo Memoria', 'id': 'Penggunaan Memori', 'ar': 'استخدام الذاكرة', 'hi': 'मेमोरी उपयोग', 'zh-CN': '内存使用', 'zh-TW': '記憶體使用', 'ja': '메モリ使用量', 'ko': '메모리 사용량', 'vi': 'Sử dụng bộ nhớ', 'th': 'การใช้หน่วยความจำ', 'pl': 'Użycie pamięci', 'uk': 'Використання пам\'яті'
    },
    '系统信息': {
      'en': 'System Info', 'pt-BR': 'Informações do Sistema', 'ru': 'Системная информация', 'tr': 'Sistem Bilgisi', 'es': 'Información del Sistema', 'fr': 'Informations Système', 'de': 'Systeminformationen', 'it': 'Informazioni di Sistema', 'id': 'Info Sistem', 'ar': 'معلومات النظام', 'hi': 'सिस्टम जानकारी', 'zh-CN': '系统信息', 'zh-TW': '系統資訊', 'ja': 'システム情報', 'ko': '시스템 정보', 'vi': 'Thông tin hệ thống', 'th': 'ข้อมูลระบบ', 'pl': 'Informacje o systemie', 'uk': 'Системна інформація'
    },
    '存储详情': {
      'en': 'Storage Details', 'pt-BR': 'Detalhes de Armazenamento', 'ru': 'Детали хранилища', 'tr': 'Depolama Detayları', 'es': 'Detalles de Almacenamiento', 'fr': 'Détails Stockage', 'de': 'Speicherdetails', 'it': 'Dettagli di Archiviazione', 'id': 'Detail Penyimpanan', 'ar': 'تفاصيل التخزين', 'hi': 'स्टोरेज विवरण', 'zh-CN': '存储详情', 'zh-TW': '儲存詳情', 'ja': 'ストレージ詳細', 'ko': '저장소 세부 정보', 'vi': 'Chi tiết bộ nhớ', 'th': 'รายละเอียดที่เก็บข้อมูล', 'pl': 'Szczegóły pamięci masowej', 'uk': 'Деталі сховища'
    },
    '上传速度': {
      'en': 'Upload Speed', 'pt-BR': 'Velocidade de Upload', 'ru': 'Скорость отдачи', 'tr': 'Yükleme Hızı', 'es': 'Velocidad de Subida', 'fr': 'Vitesse d\'Envoi', 'de': 'Upload-Geschwindigkeit', 'it': 'Velocità di Upload', 'id': 'Kecepatan Unggah', 'ar': 'سرعة الرفع', 'hi': 'अपलोड गति', 'zh-CN': '上传速度', 'zh-TW': '上傳速度', 'ja': 'アップロード速度', 'ko': '업로드 속도', 'vi': 'Tốc độ tải lên', 'th': 'ความเร็วในการอัปโหลด', 'pl': 'Prędkość wysyłania', 'uk': 'Швидкість відвантаження'
    },
    '下载速度': {
      'en': 'Download Speed', 'pt-BR': 'Velocidade de Download', 'ru': 'Скорость загрузки', 'tr': 'İndirme Hızı', 'es': 'Velocidad de Bajada', 'fr': 'Vitesse de Téléchargement', 'de': 'Download-Geschwindigkeit', 'it': 'Velocità di Download', 'id': 'Kecepatan Unduh', 'ar': 'سرعة التنزيل', 'hi': 'डाउनलोड गति', 'zh-CN': '下载速度', 'zh-TW': '下載速度', 'ja': 'ダウンロード速度', 'ko': '다운로드 속도', 'vi': 'Tốc độ tải xuống', 'th': 'ความเร็วในการดาวน์โหลด', 'pl': 'Prędkość pobierania', 'uk': 'Швидкість завантаження'
    },
    '在线': {
      'en': 'Online', 'pt-BR': 'Online', 'ru': 'В сети', 'tr': 'Çevrimiçi', 'es': 'En línea', 'fr': 'En ligne', 'de': 'Online', 'it': 'Online', 'id': 'Online', 'ar': 'متصل', 'hi': 'ऑनलाइन', 'zh-CN': '在线', 'zh-TW': '線上', 'ja': 'オンライン', 'ko': '온라인', 'vi': 'Trực tuyến', 'th': 'ออนไลน์', 'pl': 'Online', 'uk': 'Онлайн'
    },
    '离线': {
      'en': 'Offline', 'pt-BR': 'Offline', 'ru': 'Не в сети', 'tr': 'Çevrimdışı', 'es': 'Fuera de línea', 'fr': 'Hors ligne', 'de': 'Offline', 'it': 'Offline', 'id': 'Offline', 'ar': 'غير متصل', 'hi': 'ऑफ़लाइन', 'zh-CN': '离线', 'zh-TW': '離線', 'ja': 'オフライン', 'ko': '오프라인', 'vi': 'Ngoại tuyến', 'th': 'ออฟไลน์', 'pl': 'Offline', 'uk': 'Офлайн'
    },
    '总容量': {
      'en': 'Total Capacity', 'pt-BR': 'Capacidade Total', 'ru': 'Общая емкость', 'tr': 'Toplam Kapasite', 'es': 'Capacidad Total', 'fr': 'Capacité Totale', 'de': 'Gesamtkapazität', 'it': 'Capacità Totale', 'id': 'Kapasitas Total', 'ar': 'السعة الإجمالية', 'hi': 'कुल क्षमता', 'zh-CN': '总容量', 'zh-TW': '總容量', 'ja': '総容量', 'ko': '총 용량', 'vi': 'Tổng dung lượng', 'th': 'ความจุทั้งหมด', 'pl': 'Pojemność całkowita', 'uk': 'Загальна ємність'
    },
    '已使用': {
      'en': 'Used', 'pt-BR': 'Usado', 'ru': 'Использовано', 'tr': 'Kullanılan', 'es': 'Usado', 'fr': 'Utilisé', 'de': 'Verwendet', 'it': 'Usato', 'id': 'Digunakan', 'ar': 'المستخدم', 'hi': 'उपयोग किया गया', 'zh-CN': '已使用', 'zh-TW': '已使用', 'ja': '使用済み', 'ko': '사용됨', 'vi': 'Đã dùng', 'th': 'ใช้ไปแล้ว', 'pl': 'Użyte', 'uk': 'Використано'
    },
    '可用': {
      'en': 'Available', 'pt-BR': 'Disponível', 'ru': 'Доступно', 'tr': 'Mevcut', 'es': 'Disponible', 'fr': 'Disponible', 'de': 'Verfügbar', 'it': 'Disponibile', 'id': 'Tersedia', 'ar': 'متاح', 'hi': 'उपलब्ध', 'zh-CN': '可用', 'zh-TW': '可用', 'ja': '利用可能', 'ko': '사용 가능', 'vi': 'Khả dụng', 'th': 'ว่าง', 'pl': 'Dostępne', 'uk': 'Доступно'
    },
    '总上传': {
      'en': 'Total Sent', 'pt-BR': 'Total Enviado', 'ru': 'Всего отправлено', 'tr': 'Toplam Gönderilen', 'es': 'Total Enviado', 'fr': 'Total Envoyé', 'de': 'Gesamt Gesendet', 'it': 'Totale Inviato', 'id': 'Total Terkirim', 'ar': 'المجموع المرسل', 'hi': 'कुल भेजा गया', 'zh-CN': '总上传', 'zh-TW': '總上傳', 'ja': '総送信量', 'ko': '총 전송됨', 'vi': 'Tổng đã gửi', 'th': 'ส่งทั้งหมด', 'pl': 'Wysłano łącznie', 'uk': 'Всього надіслано'
    },
    '总下载': {
      'en': 'Total Received', 'pt-BR': 'Total Recebido', 'ru': 'Всего получено', 'tr': 'Toplam Alınan', 'es': 'Total Recibido', 'fr': 'Total Reçu', 'de': 'Gesamt Empfangen', 'it': 'Totale Ricevuto', 'id': 'Total Diterima', 'ar': 'المجموع المستلم', 'hi': 'कुल प्राप्त किया गया', 'zh-CN': '总下载', 'zh-TW': '總下載', 'ja': '総受信量', 'ko': '총 수신됨', 'vi': 'Tổng đã nhận', 'th': 'รับทั้งหมด', 'pl': 'Odebrano łącznie', 'uk': 'Всього отримано'
    },
    '主机名': {
      'en': 'Hostname', 'pt-BR': 'Nome do Host', 'ru': 'Имя хоста', 'tr': 'Ana Bilgisayar Adı', 'es': 'Nombre de Host', 'fr': 'Nom d\'hôte', 'de': 'Hostname', 'it': 'Nome Host', 'id': 'Nama Host', 'ar': 'اسم المضيف', 'hi': 'होस्टनाम', 'zh-CN': '主机名', 'zh-TW': '主機名', 'ja': 'ホスト名', 'ko': '호스트 이름', 'vi': 'Tên máy chủ', 'th': 'ชื่อโฮสต์', 'pl': 'Nazwa hosta', 'uk': 'Ім\'я хоста'
    },
    '操作系统': {
      'en': 'Operating System', 'pt-BR': 'Sistema Operacional', 'ru': 'Операционная система', 'tr': 'İşletim Sistemi', 'es': 'Sistema Operativo', 'fr': 'Système d\'Exploitation', 'de': 'Betriebssystem', 'it': 'Sistema Operativo', 'id': 'Sistem Operasi', 'ar': 'نظام التشغيل', 'hi': 'ऑपरेटिंग सिस्टम', 'zh-CN': '操作系统', 'zh-TW': '作業系統', 'ja': 'オペレーティングシステム', 'ko': '운영 체제', 'vi': 'Hệ điều hành', 'th': 'ระบบปฏิบัติการ', 'pl': 'System operacyjny', 'uk': 'Операційна система'
    },
    '系统版本': {
      'en': 'System Version', 'pt-BR': 'Versão do Sistema', 'ru': 'Версия системы', 'tr': 'Sistem Sürümü', 'es': 'Versión del Sistema', 'fr': 'Version du Système', 'de': 'Systemversion', 'it': 'Versione di Sistema', 'id': 'Versi Sistem', 'ar': 'إصدار النظام', 'hi': 'सिस्टम संस्करण', 'zh-CN': '系统版本', 'zh-TW': '系統版本', 'ja': 'システムバージョン', 'ko': '시스템 버전', 'vi': 'Phiên bản hệ thống', 'th': 'เวอร์ชันระบบ', 'pl': 'Wersja systemu', 'uk': 'Версія системи'
    },
    '系统运行时间': {
      'en': 'Host Uptime', 'pt-BR': 'Tempo de Atividade do Host', 'ru': 'Время работы хоста', 'tr': 'Ana Makine Çalışma Süresi', 'es': 'Tiempo de Actividad del Host', 'fr': 'Disponibilité de l\'Hôte', 'de': 'Host-Betriebszeit', 'it': 'Uptime Host', 'id': 'Uptime Host', 'ar': 'وقت تشغيل المضيف', 'hi': 'होस्ट अपटाइम', 'zh-CN': '系统运行时间', 'zh-TW': '系統運行時間', 'ja': 'ホスト稼働時間', 'ko': '호스트 가동 시간', 'vi': 'Thời gian hoạt động máy chủ', 'th': 'เวลาทำงานของโฮสต์', 'pl': 'Czas pracy hosta', 'uk': 'Час роботи хоста'
    },
    'APK输出目录': {
      'en': 'APK Output Directory', 'pt-BR': 'Diretório de Saída APK', 'ru': 'Выходной каталог APK', 'tr': 'APK Çıkış Dizini', 'es': 'Directorio de Salida APK', 'fr': 'Répertoire de Sortie APK', 'de': 'APK-Ausgabeverzeichnis', 'it': 'Directory di Output APK', 'id': 'Direktori Output APK', 'ar': 'دليل إخراج APK', 'hi': 'APK आउटपुट निर्देशिका', 'zh-CN': 'APK输出目录', 'zh-TW': 'APK輸出目錄', 'ja': 'APK出力ディレクトリ', 'ko': 'APK 출력 디렉토리', 'vi': 'Thư mục đầu ra APK', 'th': 'ไดเรกทอรีเอาต์พุต APK', 'pl': 'Katalog wyjściowy APK', 'uk': 'Вихідний каталог APK'
    },
    'AB包输出目录': {
      'en': 'AB Pack Output Directory', 'pt-BR': 'Diretório de Saída Pacote AB', 'ru': 'Выходной каталог пакетов AB', 'tr': 'AB Paket Çıkış Dizini', 'es': 'Directorio de Salida Paquete AB', 'fr': 'Répertoire de Sortie Pack AB', 'de': 'AB-Paket-Ausgabeverzeichnis', 'it': 'Directory di Output Pacchetto AB', 'id': 'Direktori Output Paket AB', 'ar': 'دليل إخراج حزم AB', 'hi': 'AB पैक आउटपुट निर्देशिका', 'zh-CN': 'AB包输出目录', 'zh-TW': 'AB包輸出目錄', 'ja': 'ABパック出力ディレクトリ', 'ko': 'AB 팩 출력 디렉토리', 'vi': 'Th thư mục đầu ra gói AB', 'th': 'ไดเรกทอรีเอาต์พุตแพ็คเกจ AB', 'pl': 'Katalog wyjściowy pakietów AB', 'uk': 'Вихідний каталог пакетів AB'
    },
    'APK文件数量': {
      'en': 'APK File Count', 'pt-BR': 'Contagem de Arquivos APK', 'ru': 'Количество файлов APK', 'tr': 'APK Dosya Sayısı', 'es': 'Cantidad de Archivos APK', 'fr': 'Nombre de Fichiers APK', 'de': 'APK-Dateianzahl', 'it': 'Numero File APK', 'id': 'Jumlah File APK', 'ar': 'عدد ملفات APK', 'hi': 'APK फ़ाइल संख्या', 'zh-CN': 'APK文件数量', 'zh-TW': 'APK檔案數量', 'ja': 'APKファイル数', 'ko': 'APK 파일 수', 'vi': 'Số lượng tệp APK', 'th': 'จำนวนไฟล์ APK', 'pl': 'Liczba plików APK', 'uk': 'Кількість файлів APK'
    },
    'AB包文件数量': {
      'en': 'AB Pack File Count', 'pt-BR': 'Contagem de Arquivos Pacote AB', 'ru': 'Количество файлов пакетов AB', 'tr': 'AB Paket Dosya Sayısı', 'es': 'Cantidad de Archivos Pacote AB', 'fr': 'Nombre de Fichiers Pack AB', 'de': 'AB-Paket-Dateianzahl', 'it': 'Numero File Pacchetto AB', 'id': 'Jumlah File Paket AB', 'ar': 'عدد ملفات حزم AB', 'hi': 'AB पैक फ़ाइल संख्या', 'zh-CN': 'AB包文件数量', 'zh-TW': 'AB包檔案數量', 'ja': 'ABパックファイル数', 'ko': 'AB 팩 파일 수', 'vi': 'Số lượng tệp gói AB', 'th': 'จำนวนไฟล์แพ็คเกจ AB', 'pl': 'Liczba plików pakietów AB', 'uk': 'Кількість файлів пакетів AB'
    }
  };

  function getStoredLang() {
    try {
      var stored = localStorage.getItem('panda_language_preference');
      if (locales[stored]) return stored;
    } catch (e) {}
    return 'zh-CN'; // Default canonical source is zh-CN
  }

  function setLanguage(langCode) {
    if (!locales[langCode]) langCode = 'zh-CN';
    try {
      localStorage.setItem('panda_language_preference', langCode);
    } catch (e) {}
    document.documentElement.setAttribute('lang', langCode);
    document.documentElement.setAttribute('dir', locales[langCode].dir);
    translatePage(langCode);
  }

  function translatePage(langCode) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while (node = walker.nextNode()) {
      if (!node._canonicalText) {
        node._canonicalText = node.nodeValue.trim();
      }
      var canonical = node._canonicalText;
      if (!canonical) continue;

      if (langCode === 'zh-CN') {
        if (node.nodeValue.trim() !== canonical) {
          node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), canonical);
        }
      } else {
        var langDict = dict[canonical];
        if (langDict && langDict[langCode]) {
          node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), langDict[langCode]);
        }
      }
    }

    var elements = document.querySelectorAll('[placeholder], [title], [aria-label]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el._canonicalPlaceholder && el.hasAttribute('placeholder')) {
        el._canonicalPlaceholder = el.getAttribute('placeholder');
      }
      if (el._canonicalPlaceholder) {
        var pCan = el._canonicalPlaceholder;
        if (langCode === 'zh-CN') {
          el.setAttribute('placeholder', pCan);
        } else if (dict[pCan] && dict[pCan][langCode]) {
          el.setAttribute('placeholder', dict[pCan][langCode]);
        }
      }

      if (!el._canonicalTitle && el.hasAttribute('title')) {
        el._canonicalTitle = el.getAttribute('title');
      }
      if (el._canonicalTitle) {
        var tCan = el._canonicalTitle;
        if (langCode === 'zh-CN') {
          el.setAttribute('title', tCan);
        } else if (dict[tCan] && dict[tCan][langCode]) {
          el.setAttribute('title', dict[tCan][langCode]);
        }
      }
    }
  }

  // Mount language selector ONLY on login page
  function mountLangSelector() {
    if (document.getElementById('panda-lang-selector-widget')) return;

    var loginCard = document.querySelector('.ant-card') || document.querySelector('input[id*="username"]') || document.querySelector('h3');
    if (!loginCard) return;

    var targetContainer = loginCard.closest('.ant-card') || loginCard.parentElement;
    if (!targetContainer) return;

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

    var cardBody = targetContainer.querySelector('.ant-card-body') || targetContainer;
    var firstChild = cardBody.querySelector('h3') || cardBody.firstChild;
    if (firstChild) {
      cardBody.insertBefore(container, firstChild.nextSibling);
    } else {
      cardBody.appendChild(container);
    }

    var select = document.getElementById('panda-lang-select');
    select.addEventListener('change', function() {
      setLanguage(this.value);
      window.location.reload();
    });
  }

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
    if ((document.querySelector('.ant-card') || document.querySelector('input[id*="username"]')) && !document.getElementById('panda-lang-selector-widget')) {
      mountLangSelector();
    }
    translatePage(lang);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
