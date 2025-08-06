
// scripts/seedData.js - Seed initial data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Domain = require('../models/Domain');
const Author = require('../models/Author');
const Idea = require('../models/Idea');
const { connectDB, clearDatabase } = require('../utils/database');

const seedUsers = async () => {
  console.log('🌱 Seeding users...');
  
  const users = [
    {
      username: 'admin',
      email: 'admin@cirp.com',
      password: 'Admin123!',
      fullName: 'System Administrator',
      isAdmin: true,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'godwin',
      email: 'godwin@cirp.com',
      password: 'Godwin123!',
      fullName: 'Godwin Developer',
      bio: 'Lead Developer and Co-founder',
      isAdmin: true,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'sathish',
      email: 'sathish@cirp.com',
      password: 'Sathish123!',
      fullName: 'Sathish Developer',
      bio: 'Backend Developer and Co-founder',
      isAdmin: true,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'sundar',
      email: 'sundar@cirp.com',
      password: 'Sundar123!',
      fullName: 'Sundar Developer',
      bio: 'Frontend Developer and Co-founder',
      isAdmin: true,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'researcher1',
      email: 'researcher1@example.com',
      password: 'Research123!',
      fullName: 'Dr. Jane Smith',
      bio: 'AI Research Scientist',
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

const seedDomains = async (users) => {
  console.log('🌱 Seeding domains...');
  
  const adminUser = users.find(u => u.username === 'admin');
  
  const domains = [
    {
      title: 'Artificial Intelligence',
      imageUrl: '/uploads/defaults/ai-domain.jpg',
      description: 'Explore the fascinating world of artificial intelligence, machine learning, and deep learning technologies.',
      detailedDescription: 'AI is revolutionizing how we solve complex problems across industries...',
      category: 'Technology',
      topics: {
        easy: ['Basic ML Algorithms', 'Data Preprocessing', 'Simple Neural Networks', 'Classification Problems'],
        medium: ['Deep Learning', 'Computer Vision', 'Natural Language Processing', 'Reinforcement Learning'],
        hard: ['Advanced Deep Learning', 'AI Ethics', 'Quantum Machine Learning', 'AI Chip Design']
      },
      tags: ['machine-learning', 'deep-learning', 'neural-networks', 'automation'],
      createdBy: adminUser._id
    },
    {
      title: 'Renewable Energy',
      imageUrl: '/uploads/defaults/energy-domain.jpg',
      description: 'Sustainable energy solutions for a greener future including solar, wind, and hydroelectric power.',
      category: 'Environment',
      topics: {
        easy: ['Solar Panel Basics', 'Wind Turbine Fundamentals', 'Energy Conservation', 'Basic Circuits'],
        medium: ['Grid Integration', 'Energy Storage Systems', 'Hybrid Systems', 'Smart Grids'],
        hard: ['Advanced Materials', 'Quantum Solar Cells', 'Fusion Energy', 'Space-Based Solar Power']
      },
      tags: ['solar', 'wind', 'sustainable', 'clean-energy'],
      createdBy: adminUser._id
    },
    {
      title: 'Biotechnology',
      imageUrl: '/uploads/defaults/biotech-domain.jpg',
      description: 'Cutting-edge research in genetics, molecular biology, and bioengineering.',
      category: 'Biology',
      topics: {
        easy: ['DNA Structure', 'Cell Biology', 'Protein Synthesis', 'Basic Genetics'],
        medium: ['Gene Editing', 'Biomarkers', 'Tissue Engineering', 'Bioinformatics'],
        hard: ['Synthetic Biology', 'CRISPR Applications', 'Personalized Medicine', 'Bionanotechnology']
      },
      tags: ['genetics', 'bioengineering', 'medicine', 'research'],
      createdBy: adminUser._id
    },
    {
      title: 'Space Technology',
      imageUrl: '/uploads/defaults/space-domain.jpg',
      description: 'Exploring the cosmos through advanced spacecraft, satellites, and space exploration technologies.',
      category: 'Engineering',
      topics: {
        easy: ['Rocket Principles', 'Satellite Basics', 'Orbital Mechanics', 'Space Materials'],
        medium: ['Mission Planning', 'Life Support Systems', 'Space Communication', 'Planetary Exploration'],
        hard: ['Interplanetary Travel', 'Space Habitats', 'Asteroid Mining', 'Interstellar Propulsion']
      },
      tags: ['rockets', 'satellites', 'exploration', 'aerospace'],
      createdBy: adminUser._id
    },
    {
      title: 'Quantum Computing',
      imageUrl: '/uploads/defaults/quantum-domain.jpg',
      description: 'Next-generation computing using quantum mechanical phenomena.',
      category: 'Technology',
      topics: {
        easy: ['Quantum Basics', 'Qubits', 'Quantum Gates', 'Simple Algorithms'],
        medium: ['Quantum Algorithms', 'Quantum Cryptography', 'Quantum Error Correction', 'Hybrid Systems'],
        hard: ['Quantum Supremacy', 'Topological Qubits', 'Quantum Internet', 'Quantum AI']
      },
      tags: ['quantum', 'computing', 'algorithms', 'cryptography'],
      createdBy: adminUser._id
    }
  ];

  const createdDomains = await Domain.insertMany(domains);
  console.log(`✅ Created ${createdDomains.length} domains`);
  return createdDomains;
};

const seedAuthors = async (users) => {
  console.log('🌱 Seeding authors...');
  
  const authors = [
    {
      authorName: 'Dr. Alice Johnson',
      authorEmail: 'alice@research.edu',
      bio: 'AI researcher with 15 years of experience in machine learning and neural networks.',
      title: 'Professor',
      organization: 'MIT',
      department: 'Computer Science',
      contactInfo: {
        email: 'alice@research.edu',
        website: 'https://alice-research.com',
        linkedin: 'alice-johnson-ai'
      },
      researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Neural Networks'],
      expertise: [
        { skill: 'Deep Learning', level: 'expert', yearsOfExperience: 10 },
        { skill: 'Python Programming', level: 'expert', yearsOfExperience: 15 },
        { skill: 'Research Methodology', level: 'expert', yearsOfExperience: 15 }
      ],
      topics: ['Neural Networks', 'Deep Learning', 'AI Ethics'],
      isVerified: true,
      userId: users[4]._id
    },
    {
      authorName: 'Dr. Bob Chen',
      authorEmail: 'bob@energy.org',
      bio: 'Renewable energy specialist focusing on solar and wind technologies.',
      title: 'Senior Research Scientist',
      organization: 'Clean Energy Institute',
      contactInfo: {
        email: 'bob@energy.org',
        phone: '+1-555-0123'
      },
      researchAreas: ['Renewable Energy', 'Solar Technology', 'Energy Storage'],
      expertise: [
        { skill: 'Solar Panel Design', level: 'expert', yearsOfExperience: 12 },
        { skill: 'Energy Storage Systems', level: 'advanced', yearsOfExperience: 8 }
      ],
      topics: ['Solar Energy', 'Grid Integration', 'Energy Storage'],
      isVerified: true
    },
    {
      authorName: 'Dr. Carol Williams',
      authorEmail: 'carol@biotech.com',
      bio: 'Biotechnology researcher specializing in gene editing and synthetic biology.',
      title: 'Principal Scientist',
      organization: 'BioInnovate Labs',
      contactInfo: {
        email: 'carol@biotech.com'
      },
      researchAreas: ['Biotechnology', 'Gene Editing', 'Synthetic Biology'],
      topics: ['CRISPR', 'Gene Editing', 'Synthetic Biology'],
      isVerified: true
    }
  ];

  const createdAuthors = await Author.insertMany(authors);
  console.log(`✅ Created ${createdAuthors.length} authors`);
  return createdAuthors;
};

const seedIdeas = async (domains, authors, users) => {
  console.log('🌱 Seeding ideas...');
  
  const aiDomain = domains.find(d => d.title === 'Artificial Intelligence');
  const energyDomain = domains.find(d => d.title === 'Renewable Energy');
  const author1 = authors[0];
  const author2 = authors[1];
  const user = users[4];

  const ideas = [
    {
      title: 'AI-Powered Smart Home Energy Management',
      description: 'Develop an AI system that learns household energy consumption patterns and automatically optimizes energy usage.',
      detailedDescription: 'This project aims to create an intelligent energy management system that uses machine learning algorithms to predict and optimize household energy consumption. The system will learn from user behavior, weather patterns, and energy prices to make real-time decisions about when to use appliances, charge electric vehicles, and store energy from renewable sources.',
      domain: aiDomain._id,
      author: author1._id,
      createdBy: user._id,
      difficulty: 'medium',
      category: 'Innovation',
      tags: ['smart-home', 'energy-efficiency', 'machine-learning', 'iot'],
      relatedLinks: [
        {
          title: 'Smart Home Energy Research',
          url: 'https://example.com/research',
          type: 'paper'
        }
      ],
      requiredSkills: [
        { skill: 'Python Programming', level: 'advanced' },
        { skill: 'Machine Learning', level: 'intermediate' },
        { skill: 'IoT Development', level: 'intermediate' }
      ],
      estimatedDuration: { value: 6, unit: 'months' },
      currentResearch: {
        overview: 'Currently investigating reinforcement learning approaches for energy optimization.',
        keyFindings: ['RL algorithms show 15% better performance than traditional methods'],
        challenges: ['Data privacy concerns', 'Real-time processing requirements'],
        nextSteps: ['Implement prototype system', 'Conduct user studies']
      },
      scope: {
        shortTerm: ['Develop basic ML model', 'Create user interface'],
        longTerm: ['Scale to multiple households', 'Integrate with smart grid'],
        limitations: ['Requires smart meters', 'Initial setup complexity']
      },
      status: 'in-progress'
    },
    {
      title: 'Floating Solar Panel Systems for Water Bodies',
      description: 'Design and implement floating solar panel systems that can be deployed on lakes, reservoirs, and coastal areas.',
      detailedDescription: 'This innovative project focuses on developing floating photovoltaic systems that can generate clean energy while conserving land resources. The floating solar panels will be designed to withstand various weather conditions and provide additional benefits such as reducing water evaporation and algae growth.',
      domain: energyDomain._id,
      author: author2._id,
      createdBy: user._id,
      difficulty: 'hard',
      category: 'Development',
      tags: ['floating-solar', 'water-conservation', 'renewable-energy', 'innovation'],
      requiredSkills: [
        { skill: 'Mechanical Engineering', level: 'advanced' },
        { skill: 'Materials Science', level: 'intermediate' },
        { skill: 'Marine Engineering', level: 'intermediate' }
      ],
      estimatedDuration: { value: 18, unit: 'months' },
      currentResearch: {
        overview: 'Investigating optimal materials and anchoring systems for floating solar installations.',
        keyFindings: ['HDPE floats show best durability', 'Mooring systems critical for stability'],
        challenges: ['Wave action effects', 'Corrosion resistance', 'Installation costs'],
        nextSteps: ['Build prototype', 'Test in controlled environment']
      },
      futureEnhancements: [
        {
          title: 'Hybrid Wind-Solar Systems',
          description: 'Integrate wind turbines with floating solar panels',
          priority: 'high'
        },
        {
          title: 'Automated Cleaning Systems',
          description: 'Develop self-cleaning mechanisms for panels',
          priority: 'medium'
        }
      ],
      status: 'planning'
    }
  ];

  const createdIdeas = await Idea.insertMany(ideas);
  
  // Update domain and author stats
  await Domain.updateMany(
    { _id: { $in: [aiDomain._id, energyDomain._id] } },
    { $inc: { 'stats.totalIdeas': 1 } }
  );
  
  await Author.updateMany(
    { _id: { $in: [author1._id, author2._id] } },
    { $inc: { 'stats.totalIdeas': 1 } }
  );

  console.log(`✅ Created ${createdIdeas.length} ideas`);
  return createdIdeas;
};

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await clearDatabase();
    
    // Seed data in order
    const users = await seedUsers();
    const domains = await seedDomains(users);
    const authors = await seedAuthors(users);
    const ideas = await seedIdeas(domains, authors, users);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Summary:
- Users: ${users.length}
- Domains: ${domains.length}
- Authors: ${authors.length}
- Ideas: ${ideas.length}

🔐 Admin Credentials:
- Email: admin@cirp.com
- Password: Admin123!

👥 Developer Accounts:
- godwin@cirp.com / Godwin123!
- sathish@cirp.com / Sathish123!
- sundar@cirp.com / Sundar123!
    `);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedDomains,
  seedAuthors,
  seedIdeas
};