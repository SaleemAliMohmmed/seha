require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedUsers() {
    try {
        console.log('بدء إضافة المستخدمين...');

        // قائمة المستخدمين المراد إضافتهم
        const users = [
            // المدراء (Admins)
            {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                is_active: 1
            },
            {
                username: 'manager1',
                password: 'manager123',
                role: 'admin',
                is_active: 1
            },
            {
                username: 'manager2',
                password: 'manager456',
                role: 'admin',
                is_active: 1
            },

            // المستخدمين العاديين (Regular Users)
            {
                username: 'user1',
                password: 'user123',
                role: 'user',
                is_active: 1
            },
            {
                username: 'user2',
                password: 'user456',
                role: 'user',
                is_active: 1
            },
            {
                username: 'user3',
                password: 'user789',
                role: 'user',
                is_active: 1
            },
            {
                username: 'doctor_user',
                password: 'doctor123',
                role: 'user',
                is_active: 1
            },
            {
                username: 'hospital_user',
                password: 'hospital123',
                role: 'user',
                is_active: 1
            }
        ];

        console.log(`\nسيتم إضافة ${users.length} مستخدم...`);
        console.log('━'.repeat(60));

        for (const userData of users) {
            try {
                // التحقق من وجود المستخدم
                const [existing] = await db.query(
                    'SELECT id FROM users WHERE username = ?',
                    [userData.username]
                );

                if (existing.length > 0) {
                    console.log(`⚠️  المستخدم "${userData.username}" موجود بالفعل - تم التخطي`);
                    continue;
                }

                // تشفير كلمة المرور
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                // إضافة المستخدم
                const [result] = await db.query(
                    'INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, ?)',
                    [userData.username, hashedPassword, userData.role, userData.is_active]
                );

                const roleArabic = userData.role === 'admin' ? 'مدير' : 'مستخدم عادي';
                console.log(`✅ تم إضافة: ${userData.username} (${roleArabic}) - كلمة المرور: ${userData.password}`);

            } catch (err) {
                console.error(`❌ خطأ في إضافة المستخدم "${userData.username}":`, err.message);
            }
        }

        console.log('━'.repeat(60));
        console.log('\n📊 ملخص المستخدمين المضافين:\n');

        // عرض جميع المستخدمين
        const [allUsers] = await db.query(
            'SELECT id, username, role, is_active, created_at FROM users ORDER BY role DESC, username'
        );

        console.log('المدراء (Admins):');
        allUsers
            .filter(u => u.role === 'admin')
            .forEach(u => {
                console.log(`  - ${u.username} (ID: ${u.id}) - ${u.is_active ? 'نشط' : 'غير نشط'}`);
            });

        console.log('\nالمستخدمين العاديين (Users):');
        allUsers
            .filter(u => u.role === 'user')
            .forEach(u => {
                console.log(`  - ${u.username} (ID: ${u.id}) - ${u.is_active ? 'نشط' : 'غير نشط'}`);
            });

        console.log('\n✅ تم إكمال عملية إضافة المستخدمين بنجاح!\n');

        // عرض بيانات تسجيل الدخول
        console.log('━'.repeat(60));
        console.log('بيانات تسجيل الدخول للمستخدمين الجدد:\n');

        console.log('المدراء:');
        users.filter(u => u.role === 'admin').forEach(u => {
            console.log(`  Username: ${u.username} | Password: ${u.password}`);
        });

        console.log('\nالمستخدمين:');
        users.filter(u => u.role === 'user').forEach(u => {
            console.log(`  Username: ${u.username} | Password: ${u.password}`);
        });
        console.log('━'.repeat(60));

        process.exit(0);

    } catch (err) {
        console.error('خطأ عام:', err);
        process.exit(1);
    }
}

// تنفيذ السكريبت
seedUsers();
