import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// رابط ملف الإصدار على GitHub
const GITHUB_VERSION_URL = 'https://raw.githubusercontent.com/saidjmohamed/OFFICELAWYER/main/version.json';

interface VersionInfo {
  version: string;
  name?: string;
  releaseDate?: string;
  githubRepo?: string;
}

export async function GET() {
  try {
    // قراءة الإصدار المحلي
    let localVersion: VersionInfo;
    try {
      const versionPath = join(process.cwd(), 'version.json');
      const versionContent = readFileSync(versionPath, 'utf-8');
      localVersion = JSON.parse(versionContent);
    } catch {
      // إذا لم يتم العثور على الملف، نرجع خطأ بصمت
      return NextResponse.json({ 
        success: false, 
        error: 'لم يتم العثور على ملف الإصدار المحلي' 
      }, { status: 500 });
    }

    // جلب الإصدار البعيد من GitHub
    let remoteVersion: VersionInfo | null = null;
    let updateAvailable = false;

    try {
      const response = await fetch(GITHUB_VERSION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // مهلة زمنية قصيرة لتجنب التأخير
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        remoteVersion = await response.json();
        
        // مقارنة الإصدارات
        if (remoteVersion && remoteVersion.version) {
          updateAvailable = compareVersions(localVersion.version, remoteVersion.version);
        }
      }
    } catch {
      // في حالة فشل الاتصال بـ GitHub، لا نعرض أي خطأ للمستخدم
      // نرجع أن الإصدار محدث
      return NextResponse.json({
        success: true,
        updateAvailable: false,
        localVersion: localVersion.version,
        remoteVersion: null,
        message: 'لا يمكن الوصول إلى GitHub حالياً',
      });
    }

    return NextResponse.json({
      success: true,
      updateAvailable,
      localVersion: localVersion.version,
      remoteVersion: remoteVersion?.version || null,
      remoteVersionInfo: remoteVersion,
      localVersionInfo: localVersion,
    });

  } catch (error) {
    // معالجة الأخطاء بصمت
    console.error('خطأ في التحقق من التحديثات:', error);
    return NextResponse.json({
      success: true,
      updateAvailable: false,
      localVersion: null,
      remoteVersion: null,
    });
  }
}

// دالة مقارنة الإصدارات
function compareVersions(local: string, remote: string): boolean {
  try {
    const localParts = local.split('.').map(Number);
    const remoteParts = remote.split('.').map(Number);

    // مقارنة كل جزء
    for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
      const localPart = localParts[i] || 0;
      const remotePart = remoteParts[i] || 0;

      if (remotePart > localPart) {
        return true; // يوجد تحديث
      }
      if (remotePart < localPart) {
        return false; // الإصدار المحلي أحدث
      }
    }

    return false; // نفس الإصدار
  } catch {
    return false;
  }
}
