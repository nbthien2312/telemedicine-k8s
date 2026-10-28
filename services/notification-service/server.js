const express = require('express'); const { Kafka } = require('kafkajs'); const app = express();
const logs = []; const kafka = new Kafka({ clientId: 'notify-service', brokers: ['kafka-service:9092'] }); const consumer = kafka.consumer({ groupId: 'notify-group' });
async function init() {
  try {
    await consumer.connect(); await consumer.subscribe({ topic: 'medical-events', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ message }) => {
        const payload = JSON.parse(message.value.toString()); const time = new Date().toLocaleTimeString('vi-VN');
        if (payload.event === 'APPOINTMENT_CREATED') logs.unshift(`[${time}] SMS -> ${payload.data.patient_name}: Xác nhận lịch khám tại ${payload.data.doctor_clinic} (${payload.data.appointment_time})`);
        else if (payload.event === 'ORDER_CREATED') logs.unshift(`[${time}] EMAIL -> ${payload.data.user_name}: Đơn thuốc ${payload.data.product_name} đã thanh toán & đang giao!`);
      },
    });
  } catch (err) { setTimeout(init, 4000); }
}
init();
app.get('/api/notifications', (req, res) => res.json(logs.slice(0, 10)));
app.get('/health', (req, res) => res.send('OK'));
app.listen(3006, () => console.log('Notification Service port 3006'));
