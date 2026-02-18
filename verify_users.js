require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function verifyLoginData() {
    try {
        console.log('🔍 التحقق من بيانات المستخدمين في قاعدة البيانات...\n');

        // جلب جميع المستخدمين
        const [users] = await db.query('SELECT id, username, password, role, is_active FROM users');

        console.log(`📊 عدد المستخدمين في قاعدة البيانات: ${users.length}\n`);

        if (users.length === 0) {
            console.log('⚠️  لا توجد مستخدمين في قاعدة البيانات!');
            process.exit(1);
        }

        // عرض معلومات المستخدمين
        console.log('قائمة المستخدمين:');
        console.log('═'.repeat(80));
        users.forEach(user => {
            const status = user.is_active ? '✅ نشط' : '❌ غير نشط';
            const roleAr = user.role === 'admin' ? 'مدير' : 'مستخدم';
            console.log(`ID: ${user.id} | Username: ${user.username.padEnd(15)} | Role: ${roleAr.padEnd(10)} | ${status}`);
        });
        console.log('═'.repeat(80));

        // اختبار تسجيل الدخول لكل مستخدم
        console.log('\n🔐 اختبار كلمات المرور:\n');

        const testPasswords = {
            'admin': 'admin123',
            'manager1': 'manager123',
            'manager2': 'manager456',
            'user1': 'user123',
            'user2': 'user456',
            'user3': 'user789',
            'doctor_user': 'doctor123',
            'hospital_user': 'hospital123'
        };

        for (const user of users) {
            const testPassword = testPasswords[user.username];

            if (testPassword) {
                try {
                    const isValid = await bcrypt.compare(testPassword, user.password);

                    if (isValid) {
                        console.log(`✅ ${user.username.padEnd(15)} - كلمة المرور صحيحة (${testPassword})`);
                    } else {
                        console.log(`❌ ${user.username.padEnd(15)} - كلمة المرور غير صحيحة!`);

                        // محاولة معرفة ما إذا كانت مشفرة بشكل صحيح
                        const hashCheck = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
                        if (!hashCheck) {
                            console.log(`   ⚠️  تحذير: كلمة المرور قد لا تكون مشفرة بشكل صحيح!`);
                        }
                    }
                } catch (err) {
                    console.log(`❌ ${user.username.padEnd(15)} - خطأ في اختبار كلمة المرور: ${err.message}`);
                }
            } else {
                console.log(`⚪ ${user.username.padEnd(15)} - لا توجد كلمة مرور تجريبية لهذا المستخدم`);
            }
        }

        // اختبار اتصال API
        console.log('\n🌐 اختبار اتصال API:\n');
        console.log('Backend يجب أن يعمل على: http://localhost:3002');
        console.log('Admin Panel يجب أن يعمل على: http://localhost:8080');
        console.log('\nتحقق من أن Backend قيد التشغيل بتنفيذ الأمر: npm start');

        console.log('\n✅ انتهى الفحص!');
        process.exit(0);

    } catch (err) {
        console.error('❌ خطأ:', err.message);
        console.error(err);
        process.exit(1);
    }
}

verifyLoginData();
