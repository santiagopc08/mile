import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Helper to parse .env.local
function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('No se encontró el archivo .env.local');
    process.exit(1);
  }
  const fileContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  fileContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;

if (!supabaseUrl || !supabaseKey || !vapidPublicKey || !vapidPrivateKey) {
  console.error('Faltan claves de entorno en .env.local. Revisa que estén configuradas.');
  process.exit(1);
}

// Configurar Web Push
webpush.setVapidDetails(
  'mailto:admin@mile.app',
  vapidPublicKey,
  vapidPrivateKey
);

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendNotification() {
  const target = 'ella';
  const message = '¡Feliz Cumpleaños, Mile! Entra a la app para ver tu sorpresa. ✨🎂';
  const type = 'cumple';

  console.log(`Buscando suscripciones de PWA para Mile (${target})...`);
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('profile', target);

  if (error) {
    console.error('Error cargando suscripciones de la base de datos:', error);
    process.exit(1);
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('\n❌ Mile no tiene suscripciones de notificación activas.');
    console.log('Para recibir notificaciones, Mile debe:');
    console.log('1. Ingresar a la App en su celular.');
    console.log('2. Iniciar sesión como ELLA (clave: "esperanza").');
    console.log('3. Tocar el ícono de la campanita de notificaciones arriba a la derecha y permitir notificaciones.');
    process.exit(0);
  }

  console.log(`¡Se encontraron ${subscriptions.length} suscripciones activas! Enviando notificación...`);

  const payload = JSON.stringify({
    title: 'Nuestro Espacio',
    body: message,
    url: '/cumple', // Redirigir directamente a la sección de cumpleaños
    type
  });

  let successCount = 0;
  for (const subRecord of subscriptions) {
    try {
      await webpush.sendNotification(subRecord.subscription, payload);
      console.log(`✅ Notificación enviada con éxito al dispositivo: ${subRecord.endpoint.substring(0, 40)}...`);
      successCount++;
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`🗑️ Removiendo suscripción expirada: ${subRecord.endpoint.substring(0, 40)}...`);
        await supabase.from('push_subscriptions').delete().eq('id', subRecord.id);
      } else {
        console.error(`❌ Falló envío al dispositivo ${subRecord.endpoint.substring(0, 40)}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Secuencia completada. Se enviaron ${successCount} notificaciones.`);
}

sendNotification();
