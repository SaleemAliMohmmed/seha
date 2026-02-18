const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

// Helper to escape HTML to prevent XSS (basic)
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper to format date as YYYY-MM-DD
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper to read the template
function getTemplate() {
    const templatePath = path.join(__dirname, '../public/inquiry.html');
    return fs.readFileSync(templatePath, 'utf8');
}

// GET /inquiry
router.get('/', (req, res) => {
    let html = getTemplate();

    // Default state: No error, no result, empty inputs
    html = html.replace('{{ERROR_DISPLAY}}', 'none');
    html = html.replace('{{ERROR_MESSAGE}}', '');
    html = html.replace('{{SERVICE_CODE}}', '');
    html = html.replace('{{NATIONAL_ID}}', '');
    html = html.replace('{{SUBMIT_DISPLAY}}', 'inline-block');
    html = html.replace('{{RESULT_SECTION}}', '');

    res.send(html);
});

// POST /inquiry
router.post('/', async (req, res) => {
    let html = getTemplate();
    const service_code = (req.body.service_code || '').trim();
    const national_id = (req.body.national_id || '').trim();

    // Preserve inputs
    html = html.replace('{{SERVICE_CODE}}', escapeHtml(service_code));
    html = html.replace('{{NATIONAL_ID}}', escapeHtml(national_id));

    let error = '';

    if (!service_code || !national_id) {
        error = "يرجى إدخال رمز الخدمة ورقم الهوية.";
    }

    if (!error) {
        try {
            // Query logic: patients table JOIN with hospitals, check gsl_code, identity_number, prevent_inquiry (0 or NULL)
            const query = `
                SELECT p.*, h.name_ar as hospital_name_ar, h.name_en as hospital_name_en 
                FROM patients p
                LEFT JOIN hospitals h ON p.hospital_id = h.id
                WHERE p.gsl_code = ? AND p.identity_number = ? AND (p.prevent_inquiry = 0 OR p.prevent_inquiry IS NULL)
            `;
            const [rows] = await db.query(query, [service_code, national_id]);

            if (rows.length > 0) {
                const report = rows[0];
                const resultHtml = `
                    <div class="results-inquiery row">
                        <div class="col-md-6 mb-2">
                            <span class="label">الاسم: </span> <span class="value">${escapeHtml(report.name_ar)}</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">المنشأة الصحية:</span> <span class="value">${escapeHtml(report.hospital_name_ar || 'غير محدد')}</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">تاريخ إصدار التقرير:</span> <span class="value">${escapeHtml(formatDate(report.issue_date))}</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">تبدأ من:</span> <span class="value">${escapeHtml(formatDate(report.date_from))}</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">وحتى:</span> <span class="value">${escapeHtml(formatDate(report.date_to))}</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">المدة بالأيام:</span> <span class="value">${escapeHtml(report.day_count)} م</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">اسم الطبيب:</span> <span class="value">${escapeHtml(report.doctor_name_ar)}</span>
                        </div>
                        <div class="col-md-6 mb-2">
                            <span class="label">المسمى الوظيفي:</span> <span class="value">${escapeHtml(report.doctor_specialty_ar)}</span>
                        </div>
                    </div>
                    <div class="text-center mt-4">
                         <a href="/inquiries/slenquiry" class="btn btn-primary">استعلام جديد</a>
                    </div>
                `;

                html = html.replace('{{RESULT_SECTION}}', resultHtml);
                html = html.replace('{{ERROR_DISPLAY}}', 'none');
                html = html.replace('{{ERROR_MESSAGE}}', '');
                html = html.replace('{{SUBMIT_DISPLAY}}', 'none');

            } else {
                error = "خطأ في الاستعلام"; // Or "No record found"
            }

        } catch (err) {
            console.error(err);
            error = "حدث خطأ أثناء الاتصال بالنظام، يرجى المحاولة لاحقًا.";
        }
    }

    if (error) {
        html = html.replace('{{ERROR_DISPLAY}}', 'block');
        html = html.replace('{{ERROR_MESSAGE}}', escapeHtml(error));
        html = html.replace('{{RESULT_SECTION}}', '');
        html = html.replace('{{SUBMIT_DISPLAY}}', 'inline-block');
    }

    res.send(html);
});

// API Endpoint for Client-Side Rendering (Netlify/Static support)
router.post('/api', async (req, res) => {
    const service_code = (req.body.service_code || '').trim();
    const national_id = (req.body.national_id || '').trim();

    if (!service_code || !national_id) {
        return res.status(400).json({ success: false, message: "يرجى إدخال رمز الخدمة ورقم الهوية." });
    }

    try {
        const query = `
            SELECT p.*, h.name_ar as hospital_name_ar, h.name_en as hospital_name_en 
            FROM patients p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE p.gsl_code = ? AND p.identity_number = ? AND (p.prevent_inquiry = 0 OR p.prevent_inquiry IS NULL)
        `;
        const [rows] = await db.query(query, [service_code, national_id]);

        if (rows.length > 0) {
            const report = rows[0];
            // Send formatted data
            res.json({
                success: true,
                data: {
                    name: report.name_ar,
                    hospital_name: report.hospital_name_ar,
                    issue_date: formatDate(report.issue_date),
                    date_from: formatDate(report.date_from),
                    date_to: formatDate(report.date_to),
                    day_count: report.day_count,
                    doctor_name: report.doctor_name_ar,
                    doctor_specialty: report.doctor_specialty_ar
                }
            });
        } else {
            res.status(404).json({ success: false, message: "خطأ في الاستعلام" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "حدث خطأ أثناء الاتصال بالنظام" });
    }
});

module.exports = router;
