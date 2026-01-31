/**
 * Bollard Simulator - Digital Twin for Smart Gate/Bollard
 *
 * This script simulates a physical IoT device (smart bollard/gate).
 * It connects to AWS IoT Core and listens for UNLOCK commands.
 *
 * SETUP:
 * 1. Create IoT Thing "Bollard_01" in AWS IoT Core
 * 2. Download certificates and place in ./certs/ folder
 * 3. Update the endpoint below with your IoT endpoint
 *
 * RUN: npx tsx scripts/bollard_sim.ts
 */

import { mqtt, iot } from 'aws-iot-device-sdk-v2';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - UPDATE THESE
const CONFIG = {
  endpoint: process.env.IOT_ENDPOINT || 'YOUR_IOT_ENDPOINT.iot.us-east-1.amazonaws.com',
  certPath: process.env.IOT_CERT || './certs/device.pem.crt',
  keyPath: process.env.IOT_KEY || './certs/private.pem.key',
  caPath: process.env.IOT_CA || './certs/AmazonRootCA1.pem',
  clientId: 'Bollard_01',
  topic: 'ecosquare/spaces/01/control',
};

// ASCII Art for visual feedback
const ASCII_OPEN = `
╔═══════════════════════════════════════════╗
║                                           ║
║     ██████╗ ██████╗ ███████╗███╗   ██╗    ║
║    ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ║
║    ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ║
║    ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ║
║    ╚██████╔╝██║     ███████╗██║ ╚████║    ║
║     ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ║
║                                           ║
║         🚗 GATE IS NOW OPEN 🚗            ║
║                                           ║
╚═══════════════════════════════════════════╝
`;

const ASCII_CLOSED = `
╔═══════════════════════════════════════════╗
║                                           ║
║     GATE STATUS: LOCKED 🔒                ║
║     Waiting for UNLOCK command...         ║
║                                           ║
╚═══════════════════════════════════════════╝
`;

const ASCII_LOCK = `
╔═══════════════════════════════════════════╗
║                                           ║
║    ██╗      ██████╗  ██████╗██╗  ██╗      ║
║    ██║     ██╔═══██╗██╔════╝██║ ██╔╝      ║
║    ██║     ██║   ██║██║     █████╔╝       ║
║    ██║     ██║   ██║██║     ██╔═██╗       ║
║    ███████╗╚██████╔╝╚██████╗██║  ██╗      ║
║    ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝      ║
║                                           ║
║         🔒 GATE IS NOW LOCKED 🔒          ║
║                                           ║
╚═══════════════════════════════════════════╝
`;

interface ControlMessage {
  command: 'UNLOCK' | 'LOCK';
  bookingId?: string;
  userId?: string;
}

async function main() {
  console.log('\n🚧 Bollard Simulator Starting...\n');
  console.log(`📡 Connecting to: ${CONFIG.endpoint}`);
  console.log(`🎯 Listening on topic: ${CONFIG.topic}\n`);

  // Check if certificates exist
  const certsExist = fs.existsSync(CONFIG.certPath) &&
                     fs.existsSync(CONFIG.keyPath) &&
                     fs.existsSync(CONFIG.caPath);

  if (!certsExist) {
    console.log('⚠️  IoT Certificates not found!');
    console.log('');
    console.log('To set up IoT certificates:');
    console.log('1. Go to AWS IoT Core → All Devices → Things');
    console.log('2. Create thing named "Bollard_01"');
    console.log('3. Select "One-click certificate creation"');
    console.log('4. Download certificates and place in ./certs/ folder:');
    console.log('   - device.pem.crt (Device certificate)');
    console.log('   - private.pem.key (Private key)');
    console.log('   - AmazonRootCA1.pem (Root CA)');
    console.log('');
    console.log('Running in DEMO MODE (simulating messages)...\n');

    // Demo mode - simulate receiving messages
    runDemoMode();
    return;
  }

  try {
    // Build MQTT connection
    const configBuilder = iot.AwsIotMqttConnectionConfigBuilder
      .new_mtls_builder_from_path(CONFIG.certPath, CONFIG.keyPath);

    configBuilder.with_certificate_authority_from_path(undefined, CONFIG.caPath);
    configBuilder.with_clean_session(false);
    configBuilder.with_client_id(CONFIG.clientId);
    configBuilder.with_endpoint(CONFIG.endpoint);

    const config = configBuilder.build();
    const client = new mqtt.MqttClient();
    const connection = client.new_connection(config);

    // Connect
    await connection.connect();
    console.log('✅ Connected to AWS IoT Core!\n');
    console.log(ASCII_CLOSED);

    // Subscribe to control topic
    await connection.subscribe(CONFIG.topic, mqtt.QoS.AtLeastOnce, (topic, payload) => {
      const message = JSON.parse(new TextDecoder().decode(payload)) as ControlMessage;
      console.log(`\n📨 Received message on ${topic}:`);
      console.log(JSON.stringify(message, null, 2));

      if (message.command === 'UNLOCK') {
        console.log(ASCII_OPEN);
        // Auto-lock after 10 seconds
        setTimeout(() => {
          console.log('\n⏰ Auto-locking gate after 10 seconds...');
          console.log(ASCII_LOCK);
        }, 10000);
      } else if (message.command === 'LOCK') {
        console.log(ASCII_LOCK);
      }
    });

    console.log(`✅ Subscribed to ${CONFIG.topic}`);
    console.log('\n🎧 Listening for commands... (Press Ctrl+C to exit)\n');

    // Keep alive
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Connection error:', error);
    process.exit(1);
  }
}

function runDemoMode() {
  console.log(ASCII_CLOSED);
  console.log('🎮 DEMO MODE: Press Enter to simulate UNLOCK command...\n');

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    if (key.toString() === '\r' || key.toString() === '\n') {
      console.log('\n📨 Simulated UNLOCK command received!');
      console.log(ASCII_OPEN);

      setTimeout(() => {
        console.log('\n⏰ Auto-locking gate after 10 seconds...');
        console.log(ASCII_LOCK);
        console.log('\n🎮 Press Enter to simulate another UNLOCK...\n');
      }, 10000);
    } else if (key.toString() === '\u0003') {
      // Ctrl+C
      console.log('\n👋 Goodbye!');
      process.exit();
    }
  });
}

main().catch(console.error);
