/**
 * Seed script — populates the database with realistic demo data.
 * Run inside Docker: docker exec jobboard-backend npx tsx src/scripts/seed.ts
 * Run locally:       MONGODB_URI=mongodb://localhost:27017/jobboard npx tsx src/scripts/seed.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Company } from '../models/company.model';
import { Job } from '../models/job.model';
import { SeekerProfile } from '../models/seeker-profile.model';

const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/jobboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const hash = (pw: string) => bcrypt.hash(pw, 12);

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({}),
    SeekerProfile.deleteMany({}),
  ]);
  console.log('🧹  Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────────

  const [adminPw, empPw, seekerPw] = await Promise.all([
    hash('Admin123!'),
    hash('Employer123!'),
    hash('Seeker123!'),
  ]);

  const admin = await User.create({
    email: 'admin@jobboard.dev',
    passwordHash: adminPw,
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  });

  const [emp1, emp2, emp3] = await User.insertMany([
    {
      email: 'alice@techcorp.dev',
      passwordHash: empPw,
      role: 'employer',
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'bob@pixelforge.dev',
      passwordHash: empPw,
      role: 'employer',
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'carol@datasphere.dev',
      passwordHash: empPw,
      role: 'employer',
      isEmailVerified: true,
      isActive: true,
    },
  ]);

  const [seeker1, seeker2, seeker3] = await User.insertMany([
    {
      email: 'emma@example.com',
      passwordHash: seekerPw,
      role: 'seeker',
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'james@example.com',
      passwordHash: seekerPw,
      role: 'seeker',
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'sara@example.com',
      passwordHash: seekerPw,
      role: 'seeker',
      isEmailVerified: true,
      isActive: true,
    },
  ]);

  console.log('👤  Created', 7, 'users');

  // ── Seeker profiles ───────────────────────────────────────────────────────

  await SeekerProfile.insertMany([
    {
      userId: seeker1._id,
      firstName: 'Emma',
      lastName: 'Watson',
      headline: 'Full-Stack Developer · React & Node.js',
      bio: 'Passionate engineer with 4 years building scalable web apps. I love clean code and great UX.',
      location: 'San Francisco, CA',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
      experienceLevel: 'mid',
      resumeUrl: 'https://example.com/emma-resume.pdf',
      resumeFileName: 'emma-resume.pdf',
    },
    {
      userId: seeker2._id,
      firstName: 'James',
      lastName: 'Smith',
      headline: 'Senior Data Scientist · ML & AI',
      bio: 'Data scientist specialising in NLP and predictive modelling. 7 years across finance and tech.',
      location: 'London, UK',
      skills: ['Python', 'TensorFlow', 'SQL', 'Spark', 'AWS'],
      experienceLevel: 'senior',
    },
    {
      userId: seeker3._id,
      firstName: 'Sara',
      lastName: 'Chen',
      headline: 'UX Designer · Figma & Design Systems',
      bio: 'Designer focused on accessibility and delight. Led design at two successful startups.',
      location: 'New York, NY',
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'CSS'],
      experienceLevel: 'mid',
    },
  ]);

  console.log('🙋  Created seeker profiles');

  // ── Companies ─────────────────────────────────────────────────────────────

  const techcorp = new Company({
    ownerId: emp1._id,
    name: 'TechCorp',
    description:
      'TechCorp is a leading SaaS company helping teams ship faster with developer-first tooling. We\'re remote-first with hubs in SF, London, and Berlin.',
    website: 'https://techcorp.dev',
    industry: 'Software / SaaS',
    size: 'medium',
    location: 'San Francisco, CA',
    isVerified: true,
  });
  await techcorp.save();

  const pixelforge = new Company({
    ownerId: emp2._id,
    name: 'PixelForge',
    description:
      'PixelForge is a boutique product design studio partnering with startups and scale-ups to craft world-class digital experiences.',
    website: 'https://pixelforge.design',
    industry: 'Design / Creative Agency',
    size: 'small',
    location: 'New York, NY',
    isVerified: false,
  });
  await pixelforge.save();

  const datasphere = new Company({
    ownerId: emp3._id,
    name: 'DataSphere Analytics',
    description:
      'DataSphere builds AI-powered analytics infrastructure for enterprises. Our platform processes 10B+ events daily across 50+ countries.',
    website: 'https://datasphere.io',
    industry: 'Data & AI',
    size: 'startup',
    location: 'London, UK',
    isVerified: true,
  });
  await datasphere.save();

  console.log('🏢  Created 3 companies');

  // ── Jobs ──────────────────────────────────────────────────────────────────

  const jobDefs = [
    // TechCorp jobs
    {
      companyId: techcorp._id,
      postedBy: emp1._id,
      title: 'Senior Backend Engineer',
      description:
        'We are looking for a Senior Backend Engineer to join our core platform team. You will design and build high-throughput APIs powering millions of developers. Our stack: Node.js, Go, Kafka, and PostgreSQL running on Kubernetes.\n\nYou will lead technical design sessions, mentor junior engineers, and drive our reliability roadmap. We ship to production multiple times a day and believe in full ownership — you build it, you run it.',
      requirements:
        '5+ years backend engineering experience. Proficiency in Node.js or Go. Experience with distributed systems, message queues, and database design. Strong understanding of REST and gRPC. Experience with Kubernetes is a plus.',
      location: 'San Francisco, CA',
      isRemote: true,
      type: 'full-time',
      category: 'Engineering',
      salaryMin: 140_000,
      salaryMax: 180_000,
      salaryCurrency: 'USD',
      experienceLevel: 'senior',
      tags: ['Node.js', 'Go', 'Kafka', 'Kubernetes', 'PostgreSQL'],
    },
    {
      companyId: techcorp._id,
      postedBy: emp1._id,
      title: 'Product Manager — Developer Tools',
      description:
        'We are hiring a Product Manager to own our CLI and SDK ecosystem. You will work directly with engineering and design to define the roadmap, gather customer feedback, and ship features developers love.\n\nThis role sits at the intersection of technical depth and strategic thinking. You\'ll run beta programmes, analyse usage metrics, and build strong relationships with our open-source community.',
      requirements:
        '3+ years product management experience, preferably in developer tools or B2B SaaS. Comfortable reading code and engaging with engineering teams at a technical level. Strong written and verbal communication skills. Data-driven decision making.',
      location: 'San Francisco, CA',
      isRemote: false,
      type: 'full-time',
      category: 'Product',
      salaryMin: 120_000,
      salaryMax: 160_000,
      salaryCurrency: 'USD',
      experienceLevel: 'mid',
      tags: ['Product Management', 'Developer Tools', 'SaaS', 'Agile'],
    },
    {
      companyId: techcorp._id,
      postedBy: emp1._id,
      title: 'DevOps Engineer',
      description:
        'TechCorp is expanding its platform reliability team. As a DevOps Engineer, you will build and maintain our CI/CD pipelines, manage Kubernetes clusters, and lead our infrastructure-as-code initiatives.\n\nYou\'ll work alongside backend and frontend engineers to ensure zero-downtime deployments and 99.99% uptime SLAs.',
      requirements:
        '3+ years in DevOps or SRE roles. Strong Kubernetes and Helm experience. Proficiency with Terraform or Pulumi. Familiarity with monitoring stacks (Prometheus, Grafana, Loki). Experience with GitHub Actions or similar CI systems.',
      location: 'Remote',
      isRemote: true,
      type: 'full-time',
      category: 'DevOps',
      salaryMin: 110_000,
      salaryMax: 150_000,
      salaryCurrency: 'USD',
      experienceLevel: 'mid',
      tags: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Prometheus'],
    },
    {
      companyId: techcorp._id,
      postedBy: emp1._id,
      title: 'Junior Frontend Developer',
      description:
        'A great opportunity for a Junior Frontend Developer to join our dashboard team and grow fast. You\'ll build UI components in React, contribute to our design system, and collaborate closely with senior engineers and designers.\n\nWe offer structured mentorship, a generous learning budget, and a culture that values curiosity over experience.',
      requirements:
        '1+ years of React experience (internships count). Solid understanding of JavaScript/TypeScript fundamentals. Familiarity with CSS/TailwindCSS. A portfolio or GitHub showing your work. Eagerness to learn and receive feedback.',
      location: 'San Francisco, CA',
      isRemote: false,
      type: 'full-time',
      category: 'Engineering',
      salaryMin: 70_000,
      salaryMax: 90_000,
      salaryCurrency: 'USD',
      experienceLevel: 'entry',
      tags: ['React', 'TypeScript', 'TailwindCSS', 'JavaScript'],
    },
    // PixelForge jobs
    {
      companyId: pixelforge._id,
      postedBy: emp2._id,
      title: 'Senior UI/UX Designer',
      description:
        'PixelForge is seeking a Senior UI/UX Designer to lead design on multiple client projects simultaneously. You\'ll run discovery workshops, produce high-fidelity prototypes in Figma, and guide junior designers.\n\nOur clients range from Series A startups to Fortune 500 enterprises. You will own the design process end-to-end and present directly to stakeholders.',
      requirements:
        '5+ years of UI/UX design experience for digital products. Expert-level Figma skills. Strong portfolio demonstrating end-to-end design process. Experience running user research and usability testing. Excellent presentation and communication skills.',
      location: 'New York, NY',
      isRemote: false,
      type: 'full-time',
      category: 'Design',
      salaryMin: 100_000,
      salaryMax: 130_000,
      salaryCurrency: 'USD',
      experienceLevel: 'senior',
      tags: ['Figma', 'UI/UX', 'Design Systems', 'User Research', 'Prototyping'],
    },
    {
      companyId: pixelforge._id,
      postedBy: emp2._id,
      title: 'Brand & Visual Designer',
      description:
        'We need a versatile Brand & Visual Designer to handle brand identity projects, marketing collateral, and social media assets for our clients. You will collaborate with the creative director and bring brand strategies to life visually.',
      requirements:
        '2+ years of brand or graphic design experience. Proficiency in Adobe Creative Suite (Illustrator, Photoshop). Experience creating brand guidelines and identity systems. Motion design skills (After Effects) are a bonus.',
      location: 'New York, NY',
      isRemote: true,
      type: 'contract',
      category: 'Design',
      salaryMin: 60_000,
      salaryMax: 90_000,
      salaryCurrency: 'USD',
      experienceLevel: 'mid',
      tags: ['Branding', 'Illustrator', 'Photoshop', 'Typography', 'Logo Design'],
    },
    // DataSphere jobs
    {
      companyId: datasphere._id,
      postedBy: emp3._id,
      title: 'Senior Data Scientist',
      description:
        'DataSphere is seeking a Senior Data Scientist to build and deploy ML models that power our real-time anomaly detection and forecasting products. You will work closely with engineering to take models from prototype to production serving billions of predictions daily.\n\nYou\'ll define our ML evaluation framework, publish internal research, and influence the technical direction of the data science organisation.',
      requirements:
        '5+ years data science or ML engineering experience. Strong Python skills (pandas, scikit-learn, PyTorch or TensorFlow). Experience deploying models to production (MLflow, SageMaker, or similar). Deep understanding of time series forecasting and anomaly detection. PhD or MSc in relevant field preferred but not required.',
      location: 'London, UK',
      isRemote: true,
      type: 'full-time',
      category: 'Data & Analytics',
      salaryMin: 90_000,
      salaryMax: 130_000,
      salaryCurrency: 'GBP',
      experienceLevel: 'senior',
      tags: ['Python', 'Machine Learning', 'PyTorch', 'MLflow', 'Time Series'],
    },
    {
      companyId: datasphere._id,
      postedBy: emp3._id,
      title: 'Data Engineer',
      description:
        'Join DataSphere\'s data infrastructure team to build the pipelines that ingest, transform, and serve petabytes of data. You\'ll design and maintain our Kafka-based streaming platform and Spark batch jobs, and help migrate our legacy ETL to a modern lakehouse architecture.',
      requirements:
        '3+ years data engineering experience. Expert knowledge of Apache Kafka and Spark. Proficiency with Python and SQL. Experience with cloud data platforms (Snowflake, BigQuery, or Databricks). Familiarity with dbt is a strong plus.',
      location: 'London, UK',
      isRemote: true,
      type: 'full-time',
      category: 'Data & Analytics',
      salaryMin: 70_000,
      salaryMax: 100_000,
      salaryCurrency: 'GBP',
      experienceLevel: 'mid',
      tags: ['Kafka', 'Spark', 'Python', 'SQL', 'dbt', 'Snowflake'],
    },
    {
      companyId: datasphere._id,
      postedBy: emp3._id,
      title: 'Data Analyst — Growth',
      description:
        'DataSphere is hiring a Data Analyst to support our growth and marketing teams with actionable insights. You\'ll build dashboards in Looker, run A/B test analyses, and present findings to non-technical stakeholders.\n\nThis is an excellent entry-level role for someone who wants to grow into data science or product analytics.',
      requirements:
        'Degree in Statistics, Maths, Economics, or a related quantitative field. Proficiency in SQL (window functions, CTEs). Experience with BI tools (Looker, Tableau, or Power BI). Familiarity with Python or R is a plus. Strong storytelling with data.',
      location: 'Remote',
      isRemote: true,
      type: 'full-time',
      category: 'Data & Analytics',
      salaryMin: 45_000,
      salaryMax: 65_000,
      salaryCurrency: 'GBP',
      experienceLevel: 'entry',
      tags: ['SQL', 'Looker', 'Python', 'A/B Testing', 'Analytics'],
    },
    {
      companyId: datasphere._id,
      postedBy: emp3._id,
      title: 'ML Intern — Summer 2026',
      description:
        'Spend your summer at DataSphere working on real production ML problems alongside our data science team. You\'ll contribute to feature engineering, model evaluation, and experiment tracking — shipping code that affects millions of users.',
      requirements:
        'Currently enrolled in a CS, Statistics, or Engineering degree (penultimate or final year). Solid Python skills. Exposure to ML libraries (scikit-learn, PyTorch). Curiosity and willingness to learn at pace.',
      location: 'London, UK',
      isRemote: false,
      type: 'internship',
      category: 'Data & Analytics',
      salaryMin: 2_500,
      salaryMax: 3_500,
      salaryCurrency: 'GBP',
      experienceLevel: 'entry',
      tags: ['Python', 'Machine Learning', 'Internship', 'scikit-learn'],
    },
  ];

  // Use individual saves so pre-save hook generates slugs
  for (const def of jobDefs) {
    const job = new Job(def);
    await job.save();
  }

  console.log(`💼  Created ${jobDefs.length} jobs`);

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Seed complete! Test accounts:');
  console.log('');
  console.log('  Admin     admin@jobboard.dev     / Admin123!');
  console.log('  Employer  alice@techcorp.dev      / Employer123!');
  console.log('  Employer  bob@pixelforge.dev      / Employer123!');
  console.log('  Employer  carol@datasphere.dev    / Employer123!');
  console.log('  Seeker    emma@example.com        / Seeker123!');
  console.log('  Seeker    james@example.com       / Seeker123!');
  console.log('  Seeker    sara@example.com        / Seeker123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch((err: unknown) => {
  console.error('❌  Seed failed:', err);
  void mongoose.disconnect();
  process.exit(1);
});
