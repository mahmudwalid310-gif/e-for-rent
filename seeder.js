// Seed demo data into db.json
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./config/db');

async function seed() {
  console.log('🗑️  Clearing existing data...');
  db.set('users', []).set('properties', []).set('payments', []).write();

  // ── Users ───────────────────────────────────────────────
  const usersRaw = [
    { name: 'Admin User',      email: 'admin@eforrent.com',  phone: '01700000000', password: 'admin123',    role: 'admin' },
    { name: 'আহসান হাবীব',    email: 'ahsan@example.com',   phone: '01811111111', password: 'landlord123', role: 'landlord' },
    { name: 'ফারিহা সুলতানা', email: 'fariha@example.com',  phone: '01922222222', password: 'user123',     role: 'user' },
    { name: 'করিম সাহেব',     email: 'karim@example.com',   phone: '01733333333', password: 'landlord123', role: 'landlord' },
  ];

  const users = await Promise.all(usersRaw.map(async u => ({
    _id: uuidv4(), ...u,
    password: await bcrypt.hash(u.password, 12),
    isActive: true,
    createdAt: new Date().toISOString()
  })));
  db.get('users').push(...users).write();
  console.log(`👥 ${users.length} users inserted`);

  // ── Properties ──────────────────────────────────────────
  const landlordId = users.find(u => u.role === 'landlord')._id;

  const props = [
    { title: 'মিরপুর ১০ এ মেস সাবলেটের জন্য ২ রুমের ফ্ল্যাট', category: 'Female Bachelor (মেস/সাবলেট)', price: 12000, address: 'রোড নং ৫, ব্লক-সি, মিরপুর ১০, ঢাকা', area: 'মিরপুর', bedrooms: 2, bathrooms: 1, advance: '১ মাসের', description: 'মেট্রোরেল স্টেশন থেকে মাত্র ৫ মিনিটের হাঁটা দূরত্বে। শুধুমাত্র চাকরিজীবী মহিলা বা ছাত্রীদের জন্য।', phone: '01881672634', images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🌐 ওয়াইফাই', '🔥 লাইনের গ্যাস'], location: { lat: 23.8103, lng: 90.3669 } },
    { title: 'উত্তরা সেক্টর ৪ এ পরিবারের জন্য ৩ রুমের ফ্ল্যাট', category: 'Family Rent (ফ্যামিলি)', price: 25000, address: 'সেক্টর ৪, উত্তরা, ঢাকা', area: 'উত্তরা', bedrooms: 3, bathrooms: 2, advance: '২ মাসের', description: 'শান্ত আবাসিক এলাকায় লিফট, পার্কিং ও নিরাপত্তাসহ সুন্দর ফ্যামিলি ফ্ল্যাট।', phone: '01700000001', images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🌐 ওয়াইফাই', '🛗 লিফট', '🛡️ সিকিউরিটি', '🚗 পার্কিং'], location: { lat: 23.8759, lng: 90.3795 } },
    { title: 'ধানমন্ডিতে ছেলেদের মেসে ১ সিট খালি', category: 'Male Bachelor (মেস/সাবলেট)', price: 4500, address: 'রোড ২৭, ধানমন্ডি, ঢাকা', area: 'ধানমন্ডি', bedrooms: 1, bathrooms: 1, advance: '১ মাসের', description: 'চাকরিজীবী ছেলেদের জন্য পরিষ্কার মেস। ওয়াইফাই ও রান্নার সুবিধা।', phone: '01700000002', images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🌐 ওয়াইফাই'], location: { lat: 23.7461, lng: 90.3742 } },
    { title: 'মোহাম্মদপুরে নতুন ২ রুমের পরিবারের বাসা', category: 'Family Rent (ফ্যামিলি)', price: 16500, address: 'মোহাম্মদপুর, ঢাকা', area: 'মোহাম্মদপুর', bedrooms: 2, bathrooms: 1, advance: '১ মাসের', description: 'নতুন ফ্ল্যাট, সব সুবিধাসহ। বাজারের কাছে, যোগাযোগ সুবিধাজনক।', phone: '01700000003', images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🔥 লাইনের গ্যাস'], location: { lat: 23.7637, lng: 90.3536 } },
    { title: 'খিলগাঁও এ চাকরিজীবী ছেলেদের জন্য রুম', category: 'Male Bachelor (মেস/সাবলেট)', price: 7000, address: 'খিলগাঁও, ঢাকা', area: 'খিলগাঁও', bedrooms: 1, bathrooms: 1, advance: '১ মাসের', description: 'শান্ত পরিবেশে চাকরিজীবীদের জন্য আলাদা রুম। ছাদ ব্যবহারের সুযোগ।', phone: '01700000004', images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🌐 ওয়াইফাই'], location: { lat: 23.7369, lng: 90.4327 } },
    { title: 'ফার্মগেটের কাছে ছাত্রীদের হোস্টেল সিট', category: 'Female Bachelor (মেস/সাবলেট)', price: 3800, address: 'ফার্মগেট, ঢাকা', area: 'ফার্মগেট', bedrooms: 1, bathrooms: 1, advance: '১ মাসের', description: 'মেডিকেল ও বিশ্ববিদ্যালয় ছাত্রীদের জন্য নিরাপদ হোস্টেল। সার্বক্ষণিক নিরাপত্তা।', phone: '01700000005', images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🌐 ওয়াইফাই', '🛡️ সিকিউরিটি'], location: { lat: 23.7599, lng: 90.3891 } },
    { title: 'বনশ্রীতে সুন্দর ৩ রুমের পরিবারের ফ্ল্যাট', category: 'Family Rent (ফ্যামিলি)', price: 20000, address: 'ব্লক-সি, বনশ্রী, ঢাকা', area: 'বনশ্রী', bedrooms: 3, bathrooms: 2, advance: '২ মাসের', description: 'বনশ্রীর শান্ত এলাকায় নতুন বিল্ডিংয়ে পরিবারের জন্য আদর্শ ফ্ল্যাট।', phone: '01700000006', images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🔥 লাইনের গ্যাস', '🛗 লিফট', '🚗 পার্কিং'], location: { lat: 23.7418, lng: 90.4486 } },
    { title: 'গুলশান ২ এ লাক্সারি অ্যাপার্টমেন্ট', category: 'Family Rent (ফ্যামিলি)', price: 55000, address: 'গুলশান ২, ঢাকা', area: 'গুলশান', bedrooms: 4, bathrooms: 3, advance: '৩ মাসের', description: 'গুলশান ২ এ আধুনিক সুযোগ সুবিধাসহ প্রিমিয়াম অ্যাপার্টমেন্ট।', phone: '01700000007', images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'], amenities: ['⚡ বিদ্যুৎ (২৪ ঘন্টা)', '🌐 ওয়াইফাই', '🛗 লিফট', '🛡️ সিকিউরিটি', '🚗 পার্কিং'], location: { lat: 23.7935, lng: 90.4122 } },
  ].map(p => ({
    _id: uuidv4(), ...p,
    ownerId: landlordId,
    isApproved: true, isAvailable: true, views: 0,
    bills: {
      rent:    { name: 'রুম ভাড়া',    amount: p.price, status: 'Unpaid' },
      current: { name: 'বিদ্যুৎ বিল',  amount: 1200,   status: 'Unpaid' },
      wifi:    { name: 'ওয়াইফাই বিল', amount: 500,    status: 'Unpaid' },
      gas:     { name: 'গ্যাস বিল',    amount: 1080,   status: 'Unpaid' }
    },
    createdAt: new Date().toISOString()
  }));

  db.get('properties').push(...props).write();
  console.log(`🏠 ${props.length} properties inserted`);

  console.log('\n✅ db.json seeded!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login Credentials:');
  console.log('   Admin    → admin@eforrent.com  / admin123');
  console.log('   Landlord → ahsan@example.com   / landlord123');
  console.log('   User     → fariha@example.com  / user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
}

seed().catch(e => { console.error(e.message); process.exit(1); });
