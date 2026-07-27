import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleQuestions = [
  {
    questionText: 'Which social engineering attack tricks victims into clicking malicious links via SMS text messages?',
    optionA: 'Phishing',
    optionB: 'Smishing',
    optionC: 'Vishing',
    optionD: 'Spear Phishing',
    correctOption: 'B',
    category: 'Social Engineering',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What type of encryption uses a pair of public and private keys for secure communication?',
    optionA: 'Symmetric Encryption',
    optionB: 'Asymmetric Encryption',
    optionC: 'Hashing',
    optionD: 'Steganography',
    correctOption: 'B',
    category: 'Cryptography',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'Which security framework principles dictate "Never Trust, Always Verify"?',
    optionA: 'Defense in Depth',
    optionB: 'Principle of Least Privilege',
    optionC: 'Zero Trust Architecture',
    optionD: 'Role-Based Access Control',
    correctOption: 'C',
    category: 'Security Architecture',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What is the primary function of a Web Application Firewall (WAF)?',
    optionA: 'Encrypt hard drive partitions',
    optionB: 'Filter, monitor, and block HTTP traffic to/from a web application',
    optionC: 'Generate strong user passwords automatically',
    optionD: 'Prevent hardware theft in data centers',
    correctOption: 'B',
    category: 'Network Security',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'Which vulnerability type occurs when untrusted user input is directly rendered into an HTML document without sanitization?',
    optionA: 'SQL Injection',
    optionB: 'Cross-Site Scripting (XSS)',
    optionC: 'Cross-Site Request Forgery (CSRF)',
    optionD: 'Buffer Overflow',
    correctOption: 'B',
    category: 'Web Security',
    difficulty: 'Hard',
    active: true,
  },
  {
    questionText: 'Which port is standard for secure HTTPS web traffic?',
    optionA: 'Port 80',
    optionB: 'Port 22',
    optionC: 'Port 443',
    optionD: 'Port 8080',
    correctOption: 'C',
    category: 'Network Security',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What malware type encrypts victim files and demands payment for the decryption key?',
    optionA: 'Spyware',
    optionB: 'Adware',
    optionC: 'Ransomware',
    optionD: 'Trojan',
    correctOption: 'C',
    category: 'Malware',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What does the abbreviation "SIEM" stand for in cybersecurity operations?',
    optionA: 'System Information and Emergency Monitoring',
    optionB: 'Security Information and Event Management',
    optionC: 'Secure Infrastructure & Endpoint Maintenance',
    optionD: 'Server Inspection and Encryption Module',
    correctOption: 'B',
    category: 'Security Operations',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'Which hashing algorithm is widely considered cryptographically broken and vulnerable to collision attacks?',
    optionA: 'SHA-256',
    optionB: 'MD5',
    optionC: 'SHA-512',
    optionD: 'BLAKE2',
    correctOption: 'B',
    category: 'Cryptography',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'What is the technique called when an attacker spoofs an IP address to flood a target system with requests?',
    optionA: 'Man-in-the-Middle Attack',
    optionB: 'Denial of Service (DoS) / SYN Flood',
    optionC: 'DNS Poisoning',
    optionD: 'Pass-the-Hash',
    correctOption: 'B',
    category: 'Network Attacks',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'Which HTTP security header forces browsers to use HTTPS only for future requests?',
    optionA: 'Content-Security-Policy',
    optionB: 'X-Frame-Options',
    optionC: 'HTTP Strict Transport Security (HSTS)',
    optionD: 'Access-Control-Allow-Origin',
    correctOption: 'C',
    category: 'Web Security',
    difficulty: 'Hard',
    active: true,
  },
  {
    questionText: 'What is Multi-Factor Authentication (MFA) designed to prevent?',
    optionA: 'DDoS attacks on servers',
    optionB: 'Unauthorized access due to stolen or compromised passwords',
    optionC: 'SQL injection in database forms',
    optionD: 'Wi-Fi eavesdropping',
    correctOption: 'B',
    category: 'Identity & Access Management',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'Which attack manipulates DNS servers to redirect legitimate website traffic to a fake malicious site?',
    optionA: 'DNS Spoofing / Poisoning',
    optionB: 'BGP Hijacking',
    optionC: 'ARP Spoofing',
    optionD: 'Session Hijacking',
    correctOption: 'A',
    category: 'Network Security',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'What is a "Zero-Day" vulnerability?',
    optionA: 'A bug that takes zero days to patch',
    optionB: 'A security vulnerability unknown to the vendor, with 0 days of protection available',
    optionC: 'A malware strain that destroys hardware on day zero',
    optionD: 'A password policy requiring daily expiration',
    correctOption: 'B',
    category: 'Threat Intelligence',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What is the main defense against SQL Injection vulnerabilities in server applications?',
    optionA: 'Client-side JavaScript validation only',
    optionB: 'Using Parameterized Queries / Prepared Statements',
    optionC: 'Increasing database connection timeout',
    optionD: 'Storing passwords in plain text',
    correctOption: 'B',
    category: 'Secure Coding',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'Which tool is commonly used by cybersecurity teams for network packet analysis?',
    optionA: 'Wireshark',
    optionB: 'Burp Suite',
    optionC: 'Metasploit',
    optionD: 'John the Ripper',
    correctOption: 'A',
    category: 'Security Tools',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What type of attack involves an adversary secretly relaying and possibly altering communication between two parties who believe they are directly communicating?',
    optionA: 'Replay Attack',
    optionB: 'Man-in-the-Middle (MitM) Attack',
    optionC: 'Brute Force Attack',
    optionD: 'Dictionary Attack',
    correctOption: 'B',
    category: 'Network Security',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'What is the practice of restricting user privileges to only what is strictly necessary to perform their job duties?',
    optionA: 'Separation of Duties',
    optionB: 'Principle of Least Privilege (PoLP)',
    optionC: 'Need to Know',
    optionD: 'Mandatory Access Control',
    correctOption: 'B',
    category: 'IAM & Governance',
    difficulty: 'Easy',
    active: true,
  },
  {
    questionText: 'What is the key difference between a Computer Virus and a Computer Worm?',
    optionA: 'Viruses affect PCs while Worms affect Macs',
    optionB: 'A virus requires a host file to execute, whereas a worm self-replicates independently over networks',
    optionC: 'Worms only infect emails',
    optionD: 'Viruses are legal security tools',
    correctOption: 'B',
    category: 'Malware',
    difficulty: 'Medium',
    active: true,
  },
  {
    questionText: 'Which cybersecurity standard specifically regulates the handling of credit card and payment data?',
    optionA: 'HIPAA',
    optionB: 'GDPR',
    optionC: 'PCI-DSS',
    optionD: 'SOX',
    correctOption: 'C',
    category: 'Compliance & Standards',
    difficulty: 'Easy',
    active: true,
  }
];

async function main() {
  console.log('Starting seed process...');
  await prisma.question.deleteMany();
  console.log('Cleared existing questions.');

  for (const q of sampleQuestions) {
    await prisma.question.create({
      data: q,
    });
  }

  console.log(`Successfully seeded ${sampleQuestions.length} cybersecurity questions.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
