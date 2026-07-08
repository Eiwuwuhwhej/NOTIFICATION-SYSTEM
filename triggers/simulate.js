#!/usr/bin/env node

/**
 * Trigger Simulator — CLI Script
 *
 * Demonstrates that the notification pipeline works end-to-end by simulating
 * real-world events and creating notifications via the API.
 *
 * Usage:
 *   node triggers/simulate.js           # Run both triggers
 *   node triggers/simulate.js invite     # Simulate team member invite
 *   node triggers/simulate.js reply      # Simulate creator reply
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// ─── Trigger Functions (decoupled & reusable) ───────────────────

/**
 * Simulates a "new team member invited" event.
 * Creates a tenant-wide notification (no specific userId).
 */
async function triggerInvite({ tenantId = 't1', userId = 'u1', memberName = 'Alex Chen', orgName = 'Nova Talent' } = {}) {
  console.log('\n🎯 Triggering: New team member invited');
  console.log(`   Member: ${memberName} → ${orgName}`);
  console.log(`   Tenant: ${tenantId} (tenant-wide notification)\n`);

  const res = await fetch(`${BASE_URL}/triggers/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'X-User-Id': userId,
    },
    body: JSON.stringify({ memberName, orgName }),
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`   ✅ Notification created: ${data.notification.id}`);
    console.log(`   📝 "${data.notification.title}" — ${data.notification.body}`);
  } else {
    console.error(`   ❌ Failed: ${data.error}`);
  }

  return data;
}

/**
 * Simulates a "creator replied to outreach" event.
 * Creates a user-specific notification (addressed to a particular user).
 */
async function triggerReply({ tenantId = 't1', userId = 'u1', creatorName = 'Marcus Johnson' } = {}) {
  console.log('\n🎯 Triggering: Creator replied to outreach');
  console.log(`   Creator: ${creatorName}`);
  console.log(`   Tenant: ${tenantId}, User: ${userId} (user-specific notification)\n`);

  const res = await fetch(`${BASE_URL}/triggers/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'X-User-Id': userId,
    },
    body: JSON.stringify({ creatorName }),
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`   ✅ Notification created: ${data.notification.id}`);
    console.log(`   📝 "${data.notification.title}" — ${data.notification.body}`);
  } else {
    console.error(`   ❌ Failed: ${data.error}`);
  }

  return data;
}

// ─── CLI Entry Point ────────────────────────────────────────────

async function main() {
  const command = process.argv[2];

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║      Notification Trigger Simulator          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`API: ${BASE_URL}`);

  try {
    if (command === 'invite') {
      await triggerInvite();
    } else if (command === 'reply') {
      await triggerReply();
    } else {
      // Run both triggers
      await triggerInvite();
      await triggerReply();
    }

    console.log('\n✨ Done! Check the notification bell in the frontend.\n');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    console.error('   Make sure the server is running: npm run dev:server\n');
    process.exit(1);
  }
}

main();
