export const LEVELS = ["Junior", "Mid", "Senior", "Lead"];

export const LEVEL_DEFAULT_YEARS: Record<string, number> = {
  Junior: 1,
  Mid: 3,
  Senior: 7,
  Lead: 12,
};

// ---- Field taxonomy ----
export const FIELDS = [
  "Engineering",
  "Data & AI / ML",
  "Infrastructure, DevOps & Cloud",
  "Security",
  "QA & Testing",
  "Product",
  "Design",
  "Engineering Leadership & Architecture",
  "Program, Project & Technical-Adjacent",
  "Emerging / Specialized",
] as const;
export type Field = (typeof FIELDS)[number];

export type RoleGroup = Field;

// Canonical soft-skill vocabulary — every role picks from this list only.
export const SOFT_SKILLS_VOCAB = [
  "Communication","Written Communication","Collaboration","Cross-functional Collaboration",
  "Problem Solving","Analytical Thinking","Critical Thinking","Attention to Detail",
  "Time Management","Prioritization","Adaptability","Ownership","Curiosity","Creativity",
  "Empathy","Mentoring","Leadership","People Management","Stakeholder Management",
  "Negotiation","Presentation","Storytelling","Facilitation","Decision Making",
  "Strategic Thinking","Business Acumen","Customer Focus","Conflict Resolution",
  "Working Under Pressure",
];

// Kept for legacy imports; equals the canonical vocab.
export const SOFT_SKILLS = SOFT_SKILLS_VOCAB;

// ---- Roles ----
type RoleDef = {
  group: RoleGroup;
  soft: string[];
  hard: string[];
  tools: string[];
};

const RAW: Record<string, RoleDef> = {
  // 1. Engineering
  "Frontend Engineer": {
    group: "Engineering",
    soft: ["Attention to Detail","Collaboration","Communication","Empathy","Problem Solving"],
    hard: ["JavaScript","TypeScript","HTML/CSS","React","Next.js","Vue","Angular","Svelte","Tailwind CSS","Redux"],
    tools: ["Git","Vite","Webpack","Storybook","Figma","Playwright","Cypress","Vercel","Netlify","Cloudflare"],
  },
  "Backend Engineer": {
    group: "Engineering",
    soft: ["Problem Solving","Analytical Thinking","Collaboration","Ownership","Communication"],
    hard: ["Python","Java","Go","C#","Ruby","PHP","TypeScript","Rust","Node.js","Express","NestJS","Django","FastAPI","Flask","Spring Boot",".NET","Rails","Laravel","GraphQL","PostgreSQL","MySQL","MongoDB","Redis"],
    tools: ["Git","Docker","Kafka","RabbitMQ","AWS","GCP","Azure"],
  },
  "Full-Stack Engineer": {
    group: "Engineering",
    soft: ["Adaptability","Problem Solving","Prioritization","Communication","Ownership"],
    hard: ["TypeScript","JavaScript","Python","Go","Ruby","HTML/CSS","React","Next.js","Node.js","Express","NestJS","Django","Rails","GraphQL","Tailwind CSS","PostgreSQL","MySQL","MongoDB","Redis"],
    tools: ["Git","Docker","Prisma","Vercel","Supabase","Firebase","AWS"],
  },
  "Software Engineer (General)": {
    group: "Engineering",
    soft: ["Problem Solving","Analytical Thinking","Collaboration","Communication","Adaptability"],
    hard: ["Python","Java","C++","C#","Go","JavaScript","TypeScript","SQL","Spring Boot",".NET","Django","React","Node.js","PostgreSQL","MySQL"],
    tools: ["Git","Docker","Kubernetes","AWS","GCP","Azure"],
  },
  "Mobile Engineer — iOS": {
    group: "Engineering",
    soft: ["Attention to Detail","Problem Solving","Empathy","Collaboration","Ownership"],
    hard: ["Swift","Objective-C","SwiftUI","UIKit","Combine"],
    tools: ["Xcode","Swift Package Manager","CocoaPods","Git","App Store","TestFlight","Firebase"],
  },
  "Mobile Engineer — Android": {
    group: "Engineering",
    soft: ["Attention to Detail","Problem Solving","Collaboration","Adaptability","Ownership"],
    hard: ["Kotlin","Java","Jetpack Compose","Coroutines","Retrofit","Room"],
    tools: ["Android Studio","Gradle","Dagger/Hilt","Git","Google Play","Firebase"],
  },
  "Mobile Engineer — Cross-platform": {
    group: "Engineering",
    soft: ["Adaptability","Problem Solving","Prioritization","Communication","Collaboration"],
    hard: ["Dart","TypeScript","JavaScript","C#","Flutter","React Native","Expo",".NET MAUI","Ionic"],
    tools: ["Git","Xcode","Android Studio","App Store","Google Play","Firebase","RevenueCat"],
  },
  "Web Developer": {
    group: "Engineering",
    soft: ["Customer Focus","Communication","Attention to Detail","Adaptability","Time Management"],
    hard: ["HTML/CSS","JavaScript","PHP","TypeScript","WordPress","React","Vue","Tailwind CSS","Bootstrap","jQuery"],
    tools: ["Git","Webflow","Shopify","Netlify","Vercel"],
  },
  "Game Developer": {
    group: "Engineering",
    soft: ["Creativity","Problem Solving","Collaboration","Attention to Detail","Working Under Pressure"],
    hard: ["C++","C#","Lua","Python","Unity","Unreal Engine","Godot"],
    tools: ["Blender","Git","DirectX","OpenGL","Vulkan","Steam"],
  },
  "Embedded / Firmware Engineer": {
    group: "Engineering",
    soft: ["Attention to Detail","Analytical Thinking","Problem Solving","Critical Thinking","Ownership"],
    hard: ["C","C++","Rust","Assembly","FreeRTOS","Zephyr"],
    tools: ["STM32","ESP32","JTAG","I2C/SPI/UART","Git","Linux (embedded)","Yocto"],
  },
  "Systems / Low-level Engineer": {
    group: "Engineering",
    soft: ["Analytical Thinking","Attention to Detail","Problem Solving","Critical Thinking","Curiosity"],
    hard: ["C","C++","Rust","Go","Assembly","POSIX","eBPF"],
    tools: ["LLVM","gdb","perf","Git","Linux","Unix"],
  },
  "Desktop / Enterprise Application Developer": {
    group: "Engineering",
    soft: ["Problem Solving","Communication","Attention to Detail","Stakeholder Management","Collaboration"],
    hard: ["C#","Java","C++","JavaScript","TypeScript",".NET","WPF","Electron","Qt","Spring Boot","SQL Server","PostgreSQL","Oracle"],
    tools: ["Git","Visual Studio","Windows","Azure"],
  },

  // 2. Data & AI / ML
  "Data Analyst": {
    group: "Data & AI / ML",
    soft: ["Analytical Thinking","Communication","Storytelling","Attention to Detail","Curiosity","Business Acumen"],
    hard: ["SQL","Python","R","pandas","A/B Testing","Data Visualization","PostgreSQL","Snowflake","BigQuery"],
    tools: ["Excel","Tableau","Power BI","Looker","dbt"],
  },
  "Data Scientist": {
    group: "Data & AI / ML",
    soft: ["Analytical Thinking","Curiosity","Communication","Storytelling","Critical Thinking","Problem Solving"],
    hard: ["Python","R","SQL","pandas","NumPy","scikit-learn","XGBoost","statsmodels","Statistical Modeling","A/B Testing","Snowflake","BigQuery","PostgreSQL"],
    tools: ["Jupyter","Matplotlib","Git","Databricks","SageMaker"],
  },
  "Data Engineer": {
    group: "Data & AI / ML",
    soft: ["Problem Solving","Attention to Detail","Ownership","Collaboration","Analytical Thinking"],
    hard: ["Python","SQL","Scala","Java","Apache Spark","Airflow","dbt","Kafka","Flink","Snowflake","BigQuery","Redshift","PostgreSQL"],
    tools: ["Git","Docker","Databricks","AWS","GCP","Azure"],
  },
  "Analytics Engineer": {
    group: "Data & AI / ML",
    soft: ["Analytical Thinking","Attention to Detail","Communication","Collaboration","Prioritization"],
    hard: ["SQL","Python","dbt","Data Modeling","Snowflake","BigQuery","Redshift"],
    tools: ["Looker","Fivetran","Airbyte","Dagster","Git"],
  },
  "Machine Learning Engineer": {
    group: "Data & AI / ML",
    soft: ["Problem Solving","Analytical Thinking","Curiosity","Collaboration","Ownership"],
    hard: ["Python","C++","Go","PyTorch","TensorFlow","scikit-learn","Hugging Face","Ray"],
    tools: ["MLflow","Docker","Kubernetes","Git","ONNX","SageMaker","Vertex AI","AWS","GCP"],
  },
  "AI / LLM Engineer": {
    group: "Data & AI / ML",
    soft: ["Curiosity","Adaptability","Problem Solving","Critical Thinking","Communication"],
    hard: ["Python","TypeScript","PyTorch","Hugging Face","LangChain","LangGraph","LlamaIndex","FastAPI","Prompt Engineering","RAG","Evals","Agents","pgvector","Pinecone","Weaviate","Chroma"],
    tools: ["OpenAI API","Anthropic API","LangSmith","vLLM","Docker","Git","MCP","AWS","GCP","Modal","Replicate"],
  },
  "ML / AI Research Scientist": {
    group: "Data & AI / ML",
    soft: ["Curiosity","Analytical Thinking","Critical Thinking","Written Communication","Collaboration"],
    hard: ["Python","PyTorch","JAX","TensorFlow","Deep Learning","Experimentation"],
    tools: ["CUDA","Weights & Biases","Git","GPU/TPU clusters","HPC"],
  },
  "MLOps Engineer": {
    group: "Data & AI / ML",
    soft: ["Ownership","Problem Solving","Collaboration","Attention to Detail","Communication"],
    hard: ["Python","Go","Bash","MLflow","Kubeflow","BentoML","Ray","CI/CD","Model Monitoring"],
    tools: ["Docker","Kubernetes","Terraform","Git","SageMaker","Vertex AI","AWS","GCP"],
  },
  "Computer Vision Engineer": {
    group: "Data & AI / ML",
    soft: ["Analytical Thinking","Problem Solving","Curiosity","Attention to Detail","Collaboration"],
    hard: ["Python","C++","OpenCV","PyTorch","TensorFlow","YOLO","Deep Learning"],
    tools: ["CUDA","Git","GPU servers","Edge devices"],
  },
  "NLP Engineer": {
    group: "Data & AI / ML",
    soft: ["Curiosity","Analytical Thinking","Problem Solving","Attention to Detail","Communication"],
    hard: ["Python","Hugging Face","spaCy","NLTK","PyTorch","RAG","Text Processing","pgvector","Pinecone"],
    tools: ["Git","Docker"],
  },
  "BI Developer / Analyst": {
    group: "Data & AI / ML",
    soft: ["Analytical Thinking","Communication","Storytelling","Attention to Detail","Business Acumen"],
    hard: ["SQL","DAX","Data Modeling","Dashboarding","SQL Server","Snowflake","BigQuery"],
    tools: ["Power BI","Tableau","Looker"],
  },
  "Data Architect": {
    group: "Data & AI / ML",
    soft: ["Strategic Thinking","Communication","Stakeholder Management","Analytical Thinking","Decision Making"],
    hard: ["SQL","Python","Apache Spark","dbt","Data Modeling","Schema Design","Snowflake","BigQuery","PostgreSQL","Redshift"],
    tools: ["Git","Data catalogs","AWS","GCP","Azure","Databricks"],
  },
  "Database Administrator (DBA)": {
    group: "Data & AI / ML",
    soft: ["Attention to Detail","Ownership","Problem Solving","Working Under Pressure","Communication"],
    hard: ["SQL","PL/SQL","Bash","PostgreSQL","MySQL","Oracle","SQL Server","MongoDB"],
    tools: ["Git","Backup/Replication tooling","AWS RDS","Cloud SQL"],
  },

  // 3. Infrastructure, DevOps & Cloud
  "DevOps Engineer": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Collaboration","Ownership","Problem Solving","Communication","Adaptability"],
    hard: ["Bash","Python","Go","YAML","CI/CD","Infrastructure as Code"],
    tools: ["Docker","Kubernetes","Terraform","Ansible","Jenkins","GitHub Actions","GitLab CI","ArgoCD","Helm","Git","AWS","GCP","Azure"],
  },
  "Site Reliability Engineer (SRE)": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Working Under Pressure","Problem Solving","Ownership","Communication","Analytical Thinking"],
    hard: ["Go","Python","Bash","Observability","Incident Response"],
    tools: ["Kubernetes","Prometheus","Grafana","Terraform","PagerDuty","OpenTelemetry","Git","AWS","GCP","Azure"],
  },
  "Platform Engineer": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Empathy","Collaboration","Communication","Problem Solving","Strategic Thinking"],
    hard: ["Go","Python","TypeScript","Infrastructure as Code","Developer Experience"],
    tools: ["Kubernetes","Terraform","Backstage","Crossplane","ArgoCD","Helm","Git","AWS","GCP"],
  },
  "Cloud Engineer / Architect": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Strategic Thinking","Communication","Decision Making","Stakeholder Management","Problem Solving"],
    hard: ["Python","Go","Bash","Infrastructure as Code","System Design"],
    tools: ["Terraform","CloudFormation","Pulumi","Kubernetes","Git","AWS","Azure","GCP"],
  },
  "Infrastructure Engineer": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Ownership","Problem Solving","Attention to Detail","Collaboration","Adaptability"],
    hard: ["Python","Go","Bash","Infrastructure as Code"],
    tools: ["Terraform","Ansible","Packer","Docker","Kubernetes","Git","AWS","GCP","Azure","VMware"],
  },
  "Network Engineer": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Analytical Thinking","Problem Solving","Attention to Detail","Working Under Pressure","Communication"],
    hard: ["Python","Bash","BGP/OSPF","VPN","Network Design"],
    tools: ["Cisco IOS","Juniper","Wireshark","SD-WAN"],
  },
  "Systems Administrator": {
    group: "Infrastructure, DevOps & Cloud",
    soft: ["Problem Solving","Time Management","Communication","Customer Focus","Ownership"],
    hard: ["Bash","PowerShell","Python"],
    tools: ["Linux","Windows Server","Active Directory","Ansible","Nagios","On-prem","Hybrid cloud"],
  },

  // 4. Security
  "Security Engineer": {
    group: "Security",
    soft: ["Critical Thinking","Attention to Detail","Communication","Problem Solving","Ownership"],
    hard: ["Python","Go","Bash","Threat Modeling","Vulnerability Management"],
    tools: ["Burp Suite","Nmap","Metasploit","SIEM","Terraform","Git","AWS","GCP","Azure"],
  },
  "Application Security (AppSec) Engineer": {
    group: "Security",
    soft: ["Attention to Detail","Communication","Collaboration","Critical Thinking","Empathy"],
    hard: ["Python","JavaScript","Java","SAST/DAST","Threat Modeling","Secure Code Review"],
    tools: ["Snyk","Semgrep","Checkmarx","Burp Suite","OWASP ZAP","Git"],
  },
  "Cloud Security Engineer": {
    group: "Security",
    soft: ["Analytical Thinking","Attention to Detail","Communication","Ownership","Problem Solving"],
    hard: ["Python","Go","IAM","Zero Trust","Posture Management"],
    tools: ["Wiz","Prisma Cloud","AWS GuardDuty","Terraform","Git","AWS","Azure","GCP"],
  },
  "Penetration Tester / Red Team": {
    group: "Security",
    soft: ["Curiosity","Creativity","Critical Thinking","Written Communication","Ownership"],
    hard: ["Python","Bash","PowerShell","Penetration Testing","OSINT","Exploit Development"],
    tools: ["Metasploit","Burp Suite","Nmap","Kali Linux","Cobalt Strike","Wireshark"],
  },
  "Security / SOC Analyst": {
    group: "Security",
    soft: ["Working Under Pressure","Attention to Detail","Analytical Thinking","Communication","Decision Making"],
    hard: ["SQL","Python","Incident Response","Threat Hunting","MITRE ATT&CK"],
    tools: ["Splunk","Microsoft Sentinel","CrowdStrike","QRadar","Wireshark"],
  },
  "GRC / Security Compliance": {
    group: "Security",
    soft: ["Attention to Detail","Written Communication","Stakeholder Management","Facilitation","Critical Thinking"],
    hard: ["SOC 2","ISO 27001","NIST","GDPR","HIPAA","Risk Assessment","Audit"],
    tools: ["Vanta","Drata","Jira"],
  },
  "Incident Response / Threat Intelligence": {
    group: "Security",
    soft: ["Working Under Pressure","Analytical Thinking","Decision Making","Communication","Attention to Detail"],
    hard: ["Python","Bash","Incident Response","Threat Hunting","Forensics","MITRE ATT&CK"],
    tools: ["Splunk","CrowdStrike","Microsoft Sentinel","EDR/XDR"],
  },

  // 5. QA & Testing
  "QA Engineer (Manual)": {
    group: "QA & Testing",
    soft: ["Attention to Detail","Critical Thinking","Communication","Curiosity","Empathy"],
    hard: ["Test Case Design","Regression Testing","Exploratory Testing"],
    tools: ["TestRail","Jira","Zephyr","Postman"],
  },
  "QA Automation Engineer": {
    group: "QA & Testing",
    soft: ["Attention to Detail","Problem Solving","Collaboration","Ownership","Communication"],
    hard: ["JavaScript","TypeScript","Python","Java","Selenium","Playwright","Cypress","Appium","pytest","Test Automation"],
    tools: ["GitHub Actions","Jenkins","Git"],
  },
  "SDET": {
    group: "QA & Testing",
    soft: ["Problem Solving","Attention to Detail","Analytical Thinking","Collaboration","Ownership"],
    hard: ["Java","Python","TypeScript","C#","Selenium","Playwright","REST Assured","JUnit","k6","Gatling","Test Automation","Performance Testing"],
    tools: ["GitHub Actions","Jenkins","Git"],
  },

  // 6. Product
  "Product Manager": {
    group: "Product",
    soft: ["Stakeholder Management","Communication","Prioritization","Empathy","Decision Making","Strategic Thinking"],
    hard: ["Roadmapping","Discovery","A/B Testing","Prioritization (RICE)","User Research"],
    tools: ["Jira","Linear","Amplitude","Mixpanel","Figma","Notion","Productboard"],
  },
  "Technical Product Manager": {
    group: "Product",
    soft: ["Communication","Analytical Thinking","Stakeholder Management","Decision Making","Collaboration"],
    hard: ["SQL","API/Platform Strategy","Technical PRDs","System Design Literacy"],
    tools: ["Jira","Postman","Amplitude","Figma"],
  },
  "Growth Product Manager": {
    group: "Product",
    soft: ["Analytical Thinking","Creativity","Prioritization","Business Acumen","Adaptability"],
    hard: ["SQL","Funnel Optimization","Experimentation","Retention/Activation Loops"],
    tools: ["Amplitude","Mixpanel","Optimizely","Braze"],
  },
  "AI / ML Product Manager": {
    group: "Product",
    soft: ["Curiosity","Critical Thinking","Communication","Adaptability","Strategic Thinking"],
    hard: ["Eval Design","Model UX","AI Literacy","Roadmapping"],
    tools: ["Amplitude","LLM APIs","Jupyter","Notion"],
  },
  "Data Product Manager": {
    group: "Product",
    soft: ["Analytical Thinking","Communication","Stakeholder Management","Prioritization","Business Acumen"],
    hard: ["SQL","Data Strategy","Metrics Design","Experimentation"],
    tools: ["Amplitude","Looker","Jira"],
  },
  "Product Owner": {
    group: "Product",
    soft: ["Prioritization","Communication","Facilitation","Stakeholder Management","Decision Making"],
    hard: ["Backlog Management","Scrum","User Stories"],
    tools: ["Jira","Azure DevOps","Confluence"],
  },
  "Product Marketing Manager": {
    group: "Product",
    soft: ["Storytelling","Communication","Creativity","Cross-functional Collaboration","Business Acumen"],
    hard: ["Positioning","GTM Strategy","Messaging","Competitive Analysis"],
    tools: ["HubSpot","Amplitude","Notion","Figma"],
  },

  // 7. Design
  "Product Designer": {
    group: "Design",
    soft: ["Empathy","Communication","Collaboration","Creativity","Critical Thinking"],
    hard: ["End-to-end UX/UI","Prototyping","Design Systems","User Research"],
    tools: ["Figma","FigJam","Framer","Notion"],
  },
  "UX Designer": {
    group: "Design",
    soft: ["Empathy","Analytical Thinking","Communication","Curiosity","Collaboration"],
    hard: ["Wireframing","User Flows","Information Architecture","Usability Testing"],
    tools: ["Figma","Sketch","Adobe XD","Maze"],
  },
  "UI Designer": {
    group: "Design",
    soft: ["Attention to Detail","Creativity","Empathy","Collaboration","Adaptability"],
    hard: ["Visual Design","Component Libraries","Responsive Layout"],
    tools: ["Figma","Sketch","Adobe XD","Photoshop","Illustrator"],
  },
  "UX Researcher": {
    group: "Design",
    soft: ["Empathy","Curiosity","Critical Thinking","Communication","Storytelling","Facilitation"],
    hard: ["User Interviews","Usability Testing","Surveys","Research Synthesis"],
    tools: ["Maze","UserTesting","Dovetail","Optimal Workshop","Lookback"],
  },
  "Interaction Designer": {
    group: "Design",
    soft: ["Creativity","Attention to Detail","Empathy","Collaboration","Curiosity"],
    hard: ["Micro-interactions","Prototyping","Motion"],
    tools: ["Figma","Framer","Principle","ProtoPie"],
  },
  "Design Systems Designer": {
    group: "Design",
    soft: ["Attention to Detail","Written Communication","Cross-functional Collaboration","Facilitation","Ownership"],
    hard: ["Design Tokens","Component Governance","Documentation"],
    tools: ["Figma","Storybook","Zeroheight"],
  },
  "UX Engineer / Design Engineer": {
    group: "Design",
    soft: ["Cross-functional Collaboration","Attention to Detail","Empathy","Adaptability","Communication"],
    hard: ["JavaScript","TypeScript","HTML/CSS","React","Tailwind CSS","Prototyping","Design Systems"],
    tools: ["Figma","Storybook","Git"],
  },
  "Content Designer / UX Writer": {
    group: "Design",
    soft: ["Written Communication","Empathy","Attention to Detail","Collaboration","Critical Thinking"],
    hard: ["UX Writing","Content Strategy","Microcopy"],
    tools: ["Figma","Notion","Ditto"],
  },
  "Visual / Graphic Designer": {
    group: "Design",
    soft: ["Creativity","Attention to Detail","Time Management","Communication","Adaptability"],
    hard: ["Branding","Layout","Marketing Assets"],
    tools: ["Adobe Photoshop","Illustrator","InDesign","Figma"],
  },
  "Motion Designer": {
    group: "Design",
    soft: ["Creativity","Attention to Detail","Time Management","Collaboration","Adaptability"],
    hard: ["Animation","Micro-interactions"],
    tools: ["After Effects","Lottie","Figma","Rive","Cinema 4D"],
  },

  // 8. Engineering Leadership & Architecture
  "Tech Lead": {
    group: "Engineering Leadership & Architecture",
    soft: ["Mentoring","Communication","Decision Making","Conflict Resolution","Prioritization"],
    hard: ["TypeScript","Python","Go","React","Node.js","System Design","Code Review","Mentoring"],
    tools: ["Git","Jira"],
  },
  "Staff / Principal Engineer": {
    group: "Engineering Leadership & Architecture",
    soft: ["Strategic Thinking","Communication","Mentoring","Decision Making","Stakeholder Management"],
    hard: ["Go","Python","Java","Architecture","Technical Strategy","System Design"],
    tools: ["Git","Docker","Kubernetes","AWS","GCP","Azure"],
  },
  "Engineering Manager": {
    group: "Engineering Leadership & Architecture",
    soft: ["People Management","Communication","Empathy","Conflict Resolution","Prioritization","Decision Making"],
    hard: ["Delivery","Hiring","Agile/Scrum"],
    tools: ["Jira","Linear","GitHub"],
  },
  "Software / Solutions Architect": {
    group: "Engineering Leadership & Architecture",
    soft: ["Strategic Thinking","Communication","Stakeholder Management","Decision Making","Presentation"],
    hard: ["Java","C#","Python","Go","Spring Boot",".NET","Microservices","System Design","API Design","Event-Driven Architecture"],
    tools: ["Terraform","Lucidchart","Git","AWS","GCP","Azure"],
  },
  "Director / VP Engineering / CTO": {
    group: "Engineering Leadership & Architecture",
    soft: ["Leadership","Strategic Thinking","People Management","Business Acumen","Communication","Negotiation"],
    hard: ["Org Design","Technical Strategy","Budgeting","Hiring"],
    tools: ["Jira","Linear"],
  },

  // 9. Program, Project & Technical-Adjacent
  "Technical Program Manager (TPM)": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Cross-functional Collaboration","Stakeholder Management","Communication","Prioritization","Working Under Pressure"],
    hard: ["Cross-team Delivery","Risk Management","Roadmapping"],
    tools: ["Jira","Confluence","Smartsheet"],
  },
  "Project Manager (Tech)": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Time Management","Communication","Stakeholder Management","Negotiation","Problem Solving"],
    hard: ["Agile/Waterfall","Scope/Timeline/Budget"],
    tools: ["Jira","Asana","MS Project","Monday"],
  },
  "Scrum Master / Agile Coach": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Facilitation","Empathy","Conflict Resolution","Communication","Mentoring"],
    hard: ["Scrum","Kanban","SAFe","Facilitation"],
    tools: ["Jira","Azure DevOps","Miro"],
  },
  "Solutions Engineer / Sales Engineer": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Presentation","Communication","Customer Focus","Adaptability","Negotiation"],
    hard: ["SQL","Python","JavaScript","Pre-sales","Technical Demos","Integrations"],
    tools: ["Postman","Demo environments","Git"],
  },
  "Developer Advocate (DevRel)": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Storytelling","Communication","Empathy","Creativity","Presentation"],
    hard: ["JavaScript","Python","Go","Content","SDK/Sample Code","Community"],
    tools: ["GitHub","Docs platforms","Git"],
  },
  "Technical Writer": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Written Communication","Attention to Detail","Curiosity","Empathy","Collaboration"],
    hard: ["Markdown","Docusaurus","API Docs","Guides","Tutorials"],
    tools: ["Git","Confluence","OpenAPI/Swagger"],
  },
  "Business / Systems Analyst": {
    group: "Program, Project & Technical-Adjacent",
    soft: ["Analytical Thinking","Communication","Stakeholder Management","Attention to Detail","Facilitation"],
    hard: ["SQL","Requirements Gathering","Process Mapping"],
    tools: ["Excel","Jira","Visio","BPMN tooling"],
  },

  // 10. Emerging / Specialized
  "Blockchain / Web3 Developer": {
    group: "Emerging / Specialized",
    soft: ["Curiosity","Attention to Detail","Problem Solving","Adaptability","Critical Thinking"],
    hard: ["Solidity","Rust","TypeScript","Go","Hardhat","Foundry","ethers.js","Anchor"],
    tools: ["Git","MetaMask","Ethereum","Solana","Layer 2s"],
  },
  "AR / VR / XR Engineer": {
    group: "Emerging / Specialized",
    soft: ["Creativity","Problem Solving","Curiosity","Collaboration","Adaptability"],
    hard: ["C#","C++","Unity","Unreal Engine","ARKit","ARCore","OpenXR"],
    tools: ["Git","Blender","Meta Quest","Apple Vision Pro"],
  },
  "Robotics Engineer": {
    group: "Emerging / Specialized",
    soft: ["Problem Solving","Analytical Thinking","Attention to Detail","Collaboration","Curiosity"],
    hard: ["C++","Python","ROS/ROS2","OpenCV"],
    tools: ["Gazebo","MoveIt","Git","Embedded controllers"],
  },
  "Data Governance / Data Quality Engineer": {
    group: "Emerging / Specialized",
    soft: ["Attention to Detail","Stakeholder Management","Written Communication","Critical Thinking","Facilitation"],
    hard: ["SQL","Python","Great Expectations","dbt","Data Quality","Lineage","Governance"],
    tools: ["Collibra","Alation","Git","Snowflake","Data catalogs"],
  },
};

export const ROLES: string[] = Object.keys(RAW);

export const ROLE_GROUP_MAP: Record<string, RoleGroup> = Object.fromEntries(
  Object.entries(RAW).map(([r, v]) => [r, v.group])
);

// role -> full skill list (hard + tools + soft), deduped, for legacy consumers
export const ROLE_STACKS: Record<string, string[]> = Object.fromEntries(
  Object.entries(RAW).map(([role, v]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const name of [...v.hard, ...v.tools, ...v.soft]) {
      if (!seen.has(name)) { seen.add(name); out.push(name); }
    }
    return [role, out];
  })
);

// ---- Field → roles ----
const rolesByGroup = (g: RoleGroup) =>
  Object.entries(RAW).filter(([, v]) => v.group === g).map(([r]) => r);

export const FIELD_ROLES: Record<Field, string[]> = {
  Engineering: rolesByGroup("Engineering"),
  "Data & AI / ML": rolesByGroup("Data & AI / ML"),
  "Infrastructure, DevOps & Cloud": rolesByGroup("Infrastructure, DevOps & Cloud"),
  Security: rolesByGroup("Security"),
  "QA & Testing": rolesByGroup("QA & Testing"),
  Product: rolesByGroup("Product"),
  Design: rolesByGroup("Design"),
  "Engineering Leadership & Architecture": rolesByGroup("Engineering Leadership & Architecture"),
  "Program, Project & Technical-Adjacent": rolesByGroup("Program, Project & Technical-Adjacent"),
  "Emerging / Specialized": rolesByGroup("Emerging / Specialized"),
};

export const ROLE_FIELD_MAP: Record<string, Field> = (() => {
  const map: Record<string, Field> = {};
  for (const f of FIELDS) for (const r of FIELD_ROLES[f]) if (!(r in map)) map[r] = f;
  return map;
})();

export function skillsForRoles(roles: string[], _field?: string) {
  const hard = new Set<string>();
  const tools = new Set<string>();
  const soft = new Set<string>();
  for (const r of roles) {
    const def = RAW[r];
    if (!def) continue;
    def.hard.forEach((x) => hard.add(x));
    def.tools.forEach((x) => tools.add(x));
    def.soft.forEach((x) => soft.add(x));
  }
  return { hard: Array.from(hard), tools: Array.from(tools), soft: Array.from(soft) };
}

// ---- US locations ----
export const USA_LOCATIONS = [
  "New York City, NY","Los Angeles, CA","San Francisco, CA","Chicago, IL","Houston, TX",
  "Dallas, TX","Austin, TX","Seattle, WA","Boston, MA","Denver, CO","Atlanta, GA","Miami, FL",
  "Phoenix, AZ","Philadelphia, PA","Portland, OR","San Diego, CA","San Jose, CA","Washington, DC",
  "Nashville, TN","Detroit, MI","Minneapolis, MN","Raleigh, NC","Charlotte, NC","Salt Lake City, UT",
  "Tampa, FL","Orlando, FL","Kansas City, MO","St. Louis, MO","Indianapolis, IN","Columbus, OH",
  "Cleveland, OH","Cincinnati, OH","Pittsburgh, PA","Baltimore, MD","Milwaukee, WI","Sacramento, CA",
  "Riverside, CA","Las Vegas, NV","Albuquerque, NM","Oklahoma City, OK","Tulsa, OK","Memphis, TN",
  "Louisville, KY","Birmingham, AL","Richmond, VA","New Orleans, LA","Buffalo, NY","Rochester, NY",
  "Providence, RI","Hartford, CT","Boise, ID","Madison, WI","Des Moines, IA","Omaha, NE",
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia",
};

export const CITIES_BY_STATE: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const loc of USA_LOCATIONS) {
    const m = loc.match(/^(.*),\s*([A-Z]{2})$/);
    if (!m) continue;
    const [, city, code] = m;
    (map[code] ||= []).push(city);
  }
  return map;
})();

export const US_STATES: { code: string; name: string }[] = Object.keys(CITIES_BY_STATE)
  .sort()
  .map((code) => ({ code, name: STATE_NAMES[code] ?? code }));

// ---- Languages ----
export const POPULAR_LANGUAGES = [
  "English","Spanish","French","German","Portuguese","Ukrainian","Polish","Russian",
  "Mandarin","Hindi","Arabic","Japanese","Italian","Dutch",
];

export const PROFICIENCY_LEVELS = ["A1","A2","B1","B2","C1","C2","Native"] as const;

// Fields where relocation / travel questions are relevant.
export const RELO_TRAVEL_FIELDS: Field[] = [
  "Engineering Leadership & Architecture",
  "Program, Project & Technical-Adjacent",
  "Product",
];
