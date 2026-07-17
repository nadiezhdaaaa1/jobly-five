export const LEVELS = ["Junior", "Mid", "Senior", "Lead"];

export const SPOKEN_LANGUAGES = [
  "English","Spanish","Chinese","Tagalog","Vietnamese","Arabic","French","Korean","Portuguese",
  "Haitian Creole","Hindi","German","Dutch","Polish","Italian","Urdu","Persian","Japanese",
  "Gujarati","Bengali",
];

export type StackTag =
  | "Language"
  | "Framework"
  | "Database"
  | "Tool"
  | "Platform"
  | "Method";

export type RoleGroup =
  | "Engineering"
  | "Data & AI"
  | "Infrastructure"
  | "Security"
  | "QA"
  | "Product"
  | "Design"
  | "Leadership"
  | "Program"
  | "Specialized";

// Raw role -> tagged stack. Source: docs/jobly-roles-and-stacks.md
const RAW: Record<string, { group: RoleGroup } & Partial<Record<StackTag, string[]>>> = {
  // ---- Engineering ----
  "Frontend Engineer": {
    group: "Engineering",
    Language: ["JavaScript", "TypeScript", "HTML/CSS"],
    Framework: ["React", "Next.js", "Vue", "Angular", "Svelte", "Tailwind CSS", "Redux"],
    Tool: ["Git", "Vite", "Webpack", "Storybook", "Figma", "Playwright", "Cypress"],
    Platform: ["Vercel", "Netlify", "Cloudflare"],
  },
  "Backend Engineer": {
    group: "Engineering",
    Language: ["Python", "Java", "Go", "C#", "Ruby", "PHP", "TypeScript", "Rust"],
    Framework: ["Node.js", "Express", "NestJS", "Django", "FastAPI", "Flask", "Spring Boot", ".NET", "Rails", "Laravel", "GraphQL"],
    Database: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
    Tool: ["Git", "Docker", "Kafka", "RabbitMQ"],
    Platform: ["AWS", "GCP", "Azure"],
  },
  "Full-Stack Engineer": {
    group: "Engineering",
    Language: ["TypeScript", "JavaScript", "Python", "Go", "Ruby", "HTML/CSS"],
    Framework: ["React", "Next.js", "Node.js", "Express", "NestJS", "Django", "Rails", "GraphQL", "Tailwind CSS"],
    Database: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
    Tool: ["Git", "Docker", "Prisma"],
    Platform: ["Vercel", "Supabase", "Firebase", "AWS"],
  },
  "Software Engineer": {
    group: "Engineering",
    Language: ["Python", "Java", "C++", "C#", "Go", "JavaScript", "TypeScript", "SQL"],
    Framework: ["Spring Boot", ".NET", "Django", "React", "Node.js"],
    Database: ["PostgreSQL", "MySQL"],
    Tool: ["Git", "Docker", "Kubernetes"],
    Platform: ["AWS", "GCP", "Azure"],
  },
  "iOS Engineer": {
    group: "Engineering",
    Language: ["Swift", "Objective-C"],
    Framework: ["SwiftUI", "UIKit", "Combine"],
    Tool: ["Xcode", "Swift Package Manager", "CocoaPods", "Git"],
    Platform: ["App Store", "TestFlight", "Firebase"],
  },
  "Android Engineer": {
    group: "Engineering",
    Language: ["Kotlin", "Java"],
    Framework: ["Jetpack Compose", "Coroutines", "Retrofit", "Room"],
    Tool: ["Android Studio", "Gradle", "Dagger/Hilt", "Git"],
    Platform: ["Google Play", "Firebase"],
  },
  "Mobile Engineer (Cross-platform)": {
    group: "Engineering",
    Language: ["Dart", "TypeScript", "JavaScript", "C#"],
    Framework: ["Flutter", "React Native", "Expo", ".NET MAUI", "Ionic"],
    Tool: ["Git", "Xcode", "Android Studio"],
    Platform: ["App Store", "Google Play", "Firebase", "RevenueCat"],
  },
  "Web Developer": {
    group: "Engineering",
    Language: ["HTML/CSS", "JavaScript", "PHP", "TypeScript"],
    Framework: ["WordPress", "React", "Vue", "Tailwind CSS", "Bootstrap", "jQuery"],
    Tool: ["Git", "Webflow", "Shopify"],
    Platform: ["Netlify", "Vercel"],
  },
  "Game Developer": {
    group: "Engineering",
    Language: ["C++", "C#", "Lua", "Python"],
    Framework: ["Unity", "Unreal Engine", "Godot"],
    Tool: ["Blender", "Git", "DirectX", "OpenGL", "Vulkan"],
    Platform: ["Steam"],
  },
  "Embedded / Firmware Engineer": {
    group: "Engineering",
    Language: ["C", "C++", "Rust", "Assembly"],
    Framework: ["FreeRTOS", "Zephyr"],
    Tool: ["STM32", "ESP32", "JTAG", "I2C/SPI/UART", "Git"],
    Platform: ["Linux (embedded)", "Yocto"],
  },
  "Systems / Low-level Engineer": {
    group: "Engineering",
    Language: ["C", "C++", "Rust", "Go", "Assembly"],
    Framework: ["POSIX", "eBPF"],
    Tool: ["LLVM", "gdb", "perf", "Git"],
    Platform: ["Linux", "Unix"],
  },
  "Desktop / Enterprise Developer": {
    group: "Engineering",
    Language: ["C#", "Java", "C++", "JavaScript", "TypeScript"],
    Framework: [".NET", "WPF", "Electron", "Qt", "Spring Boot"],
    Database: ["SQL Server", "PostgreSQL", "Oracle"],
    Tool: ["Git", "Visual Studio"],
    Platform: ["Windows", "Azure"],
  },
  // ---- Data & AI ----
  "Data Analyst": {
    group: "Data & AI",
    Language: ["SQL", "Python", "R"],
    Framework: ["pandas"],
    Database: ["PostgreSQL", "Snowflake", "BigQuery"],
    Tool: ["Excel", "Tableau", "Power BI", "Looker", "dbt"],
    Method: ["A/B Testing", "Data Visualization"],
  },
  "Data Scientist": {
    group: "Data & AI",
    Language: ["Python", "R", "SQL"],
    Framework: ["pandas", "NumPy", "scikit-learn", "XGBoost", "statsmodels"],
    Database: ["Snowflake", "BigQuery", "PostgreSQL"],
    Tool: ["Jupyter", "Matplotlib", "Git"],
    Platform: ["Databricks", "SageMaker"],
    Method: ["Statistical Modeling", "A/B Testing"],
  },
  "Data Engineer": {
    group: "Data & AI",
    Language: ["Python", "SQL", "Scala", "Java"],
    Framework: ["Apache Spark", "Airflow", "dbt", "Kafka", "Flink"],
    Database: ["Snowflake", "BigQuery", "Redshift", "PostgreSQL"],
    Tool: ["Git", "Docker"],
    Platform: ["Databricks", "AWS", "GCP", "Azure"],
  },
  "Analytics Engineer": {
    group: "Data & AI",
    Language: ["SQL", "Python"],
    Framework: ["dbt"],
    Database: ["Snowflake", "BigQuery", "Redshift"],
    Tool: ["Looker", "Fivetran", "Airbyte", "Dagster", "Git"],
    Method: ["Data Modeling"],
  },
  "Machine Learning Engineer": {
    group: "Data & AI",
    Language: ["Python", "C++", "Go"],
    Framework: ["PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "Ray"],
    Tool: ["MLflow", "Docker", "Kubernetes", "Git", "ONNX"],
    Platform: ["SageMaker", "Vertex AI", "AWS", "GCP"],
  },
  "AI / LLM Engineer": {
    group: "Data & AI",
    Language: ["Python", "TypeScript"],
    Framework: ["PyTorch", "Hugging Face", "LangChain", "LangGraph", "LlamaIndex", "FastAPI"],
    Database: ["pgvector", "Pinecone", "Weaviate", "Chroma"],
    Tool: ["OpenAI API", "Anthropic API", "LangSmith", "vLLM", "Docker", "Git", "MCP"],
    Platform: ["AWS", "GCP", "Modal", "Replicate"],
    Method: ["Prompt Engineering", "RAG", "Evals", "Agents"],
  },
  "ML / AI Research Scientist": {
    group: "Data & AI",
    Language: ["Python"],
    Framework: ["PyTorch", "JAX", "TensorFlow"],
    Tool: ["CUDA", "Weights & Biases", "Git"],
    Platform: ["GPU/TPU clusters", "HPC"],
    Method: ["Deep Learning", "Experimentation"],
  },
  "MLOps Engineer": {
    group: "Data & AI",
    Language: ["Python", "Go", "Bash"],
    Framework: ["MLflow", "Kubeflow", "BentoML", "Ray"],
    Tool: ["Docker", "Kubernetes", "Terraform", "Git"],
    Platform: ["SageMaker", "Vertex AI", "AWS", "GCP"],
    Method: ["CI/CD", "Model Monitoring"],
  },
  "Computer Vision Engineer": {
    group: "Data & AI",
    Language: ["Python", "C++"],
    Framework: ["OpenCV", "PyTorch", "TensorFlow", "YOLO"],
    Tool: ["CUDA", "Git"],
    Platform: ["GPU servers", "Edge devices"],
    Method: ["Deep Learning"],
  },
  "NLP Engineer": {
    group: "Data & AI",
    Language: ["Python"],
    Framework: ["Hugging Face", "spaCy", "NLTK", "PyTorch"],
    Database: ["pgvector", "Pinecone"],
    Tool: ["Git", "Docker"],
    Method: ["RAG", "Text Processing"],
  },
  "BI Developer": {
    group: "Data & AI",
    Language: ["SQL", "DAX"],
    Database: ["SQL Server", "Snowflake", "BigQuery"],
    Tool: ["Power BI", "Tableau", "Looker"],
    Method: ["Data Modeling", "Dashboarding"],
  },
  "Data Architect": {
    group: "Data & AI",
    Language: ["SQL", "Python"],
    Framework: ["Apache Spark", "dbt"],
    Database: ["Snowflake", "BigQuery", "PostgreSQL", "Redshift"],
    Tool: ["Git", "Data catalogs"],
    Platform: ["AWS", "GCP", "Azure", "Databricks"],
    Method: ["Data Modeling", "Schema Design"],
  },
  "Database Administrator": {
    group: "Data & AI",
    Language: ["SQL", "PL/SQL", "Bash"],
    Database: ["PostgreSQL", "MySQL", "Oracle", "SQL Server", "MongoDB"],
    Tool: ["Git", "Backup/Replication tooling"],
    Platform: ["AWS RDS", "Cloud SQL"],
  },
  // ---- Infrastructure ----
  "DevOps Engineer": {
    group: "Infrastructure",
    Language: ["Bash", "Python", "Go", "YAML"],
    Tool: ["Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "ArgoCD", "Helm", "Git"],
    Platform: ["AWS", "GCP", "Azure"],
    Method: ["CI/CD", "Infrastructure as Code"],
  },
  "Site Reliability Engineer": {
    group: "Infrastructure",
    Language: ["Go", "Python", "Bash"],
    Tool: ["Kubernetes", "Prometheus", "Grafana", "Terraform", "PagerDuty", "OpenTelemetry", "Git"],
    Platform: ["AWS", "GCP", "Azure"],
    Method: ["Observability", "Incident Response"],
  },
  "Platform Engineer": {
    group: "Infrastructure",
    Language: ["Go", "Python", "TypeScript"],
    Tool: ["Kubernetes", "Terraform", "Backstage", "Crossplane", "ArgoCD", "Helm", "Git"],
    Platform: ["AWS", "GCP"],
    Method: ["Infrastructure as Code", "Developer Experience"],
  },
  "Cloud Engineer": {
    group: "Infrastructure",
    Language: ["Python", "Go", "Bash"],
    Tool: ["Terraform", "CloudFormation", "Pulumi", "Kubernetes", "Git"],
    Platform: ["AWS", "Azure", "GCP"],
    Method: ["Infrastructure as Code", "System Design"],
  },
  "Infrastructure Engineer": {
    group: "Infrastructure",
    Language: ["Python", "Go", "Bash"],
    Tool: ["Terraform", "Ansible", "Packer", "Docker", "Kubernetes", "Git"],
    Platform: ["AWS", "GCP", "Azure", "VMware"],
    Method: ["Infrastructure as Code"],
  },
  "Network Engineer": {
    group: "Infrastructure",
    Language: ["Python", "Bash"],
    Tool: ["Cisco IOS", "Juniper", "Wireshark", "SD-WAN"],
    Method: ["BGP/OSPF", "VPN", "Network Design"],
  },
  "Systems Administrator": {
    group: "Infrastructure",
    Language: ["Bash", "PowerShell", "Python"],
    Tool: ["Linux", "Windows Server", "Active Directory", "Ansible", "Nagios"],
    Platform: ["On-prem", "Hybrid cloud"],
  },
  // ---- Security ----
  "Security Engineer": {
    group: "Security",
    Language: ["Python", "Go", "Bash"],
    Tool: ["Burp Suite", "Nmap", "Metasploit", "SIEM", "Terraform", "Git"],
    Platform: ["AWS", "GCP", "Azure"],
    Method: ["Threat Modeling", "Vulnerability Management"],
  },
  "AppSec Engineer": {
    group: "Security",
    Language: ["Python", "JavaScript", "Java"],
    Tool: ["Snyk", "Semgrep", "Checkmarx", "Burp Suite", "OWASP ZAP", "Git"],
    Method: ["SAST/DAST", "Threat Modeling", "Secure Code Review"],
  },
  "Cloud Security Engineer": {
    group: "Security",
    Language: ["Python", "Go"],
    Tool: ["Wiz", "Prisma Cloud", "AWS GuardDuty", "Terraform", "Git"],
    Platform: ["AWS", "Azure", "GCP"],
    Method: ["IAM", "Zero Trust", "Posture Management"],
  },
  "Penetration Tester": {
    group: "Security",
    Language: ["Python", "Bash", "PowerShell"],
    Tool: ["Metasploit", "Burp Suite", "Nmap", "Kali Linux", "Cobalt Strike", "Wireshark"],
    Method: ["Penetration Testing", "OSINT", "Exploit Development"],
  },
  "SOC Analyst": {
    group: "Security",
    Language: ["SQL", "Python"],
    Tool: ["Splunk", "Microsoft Sentinel", "CrowdStrike", "QRadar", "Wireshark"],
    Method: ["Incident Response", "Threat Hunting", "MITRE ATT&CK"],
  },
  "GRC Analyst": {
    group: "Security",
    Tool: ["Vanta", "Drata", "Jira"],
    Method: ["SOC 2", "ISO 27001", "NIST", "GDPR", "HIPAA", "Risk Assessment", "Audit"],
  },
  "Incident Response Analyst": {
    group: "Security",
    Language: ["Python", "Bash"],
    Tool: ["Splunk", "CrowdStrike", "Microsoft Sentinel", "EDR/XDR"],
    Method: ["Incident Response", "Threat Hunting", "Forensics", "MITRE ATT&CK"],
  },
  // ---- QA ----
  "QA Engineer": {
    group: "QA",
    Tool: ["TestRail", "Jira", "Zephyr", "Postman"],
    Method: ["Test Case Design", "Regression Testing", "Exploratory Testing"],
  },
  "QA Automation Engineer": {
    group: "QA",
    Language: ["JavaScript", "TypeScript", "Python", "Java"],
    Framework: ["Selenium", "Playwright", "Cypress", "Appium", "pytest"],
    Tool: ["GitHub Actions", "Jenkins", "Git"],
    Method: ["Test Automation"],
  },
  "SDET": {
    group: "QA",
    Language: ["Java", "Python", "TypeScript", "C#"],
    Framework: ["Selenium", "Playwright", "REST Assured", "JUnit", "k6", "Gatling"],
    Tool: ["GitHub Actions", "Jenkins", "Git"],
    Method: ["Test Automation", "Performance Testing"],
  },
  // ---- Product ----
  "Product Manager": {
    group: "Product",
    Tool: ["Jira", "Linear", "Amplitude", "Mixpanel", "Figma", "Notion", "Productboard"],
    Method: ["Roadmapping", "Discovery", "A/B Testing", "Prioritization (RICE)", "User Research"],
  },
  "Technical Product Manager": {
    group: "Product",
    Language: ["SQL"],
    Tool: ["Jira", "Postman", "Amplitude", "Figma"],
    Method: ["API/Platform Strategy", "Technical PRDs", "System Design Literacy"],
  },
  "Growth Product Manager": {
    group: "Product",
    Language: ["SQL"],
    Tool: ["Amplitude", "Mixpanel", "Optimizely", "Braze"],
    Method: ["Funnel Optimization", "Experimentation", "Retention/Activation Loops"],
  },
  "AI Product Manager": {
    group: "Product",
    Tool: ["Amplitude", "LLM APIs", "Jupyter", "Notion"],
    Method: ["Eval Design", "Model UX", "AI Literacy", "Roadmapping"],
  },
  "Data Product Manager": {
    group: "Product",
    Language: ["SQL"],
    Tool: ["Amplitude", "Looker", "Jira"],
    Method: ["Data Strategy", "Metrics Design", "Experimentation"],
  },
  "Product Owner": {
    group: "Product",
    Tool: ["Jira", "Azure DevOps", "Confluence"],
    Method: ["Backlog Management", "Scrum", "User Stories"],
  },
  "Product Marketing Manager": {
    group: "Product",
    Tool: ["HubSpot", "Amplitude", "Notion", "Figma"],
    Method: ["Positioning", "GTM Strategy", "Messaging", "Competitive Analysis"],
  },
  // ---- Design ----
  "Product Designer": {
    group: "Design",
    Tool: ["Figma", "FigJam", "Framer", "Notion"],
    Method: ["End-to-end UX/UI", "Prototyping", "Design Systems", "User Research"],
  },
  "UX Designer": {
    group: "Design",
    Tool: ["Figma", "Sketch", "Adobe XD", "Maze"],
    Method: ["Wireframing", "User Flows", "Information Architecture", "Usability Testing"],
  },
  "UI Designer": {
    group: "Design",
    Tool: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
    Method: ["Visual Design", "Component Libraries", "Responsive Layout"],
  },
  "UX Researcher": {
    group: "Design",
    Tool: ["Maze", "UserTesting", "Dovetail", "Optimal Workshop", "Lookback"],
    Method: ["User Interviews", "Usability Testing", "Surveys", "Research Synthesis"],
  },
  "Interaction Designer": {
    group: "Design",
    Tool: ["Figma", "Framer", "Principle", "ProtoPie"],
    Method: ["Micro-interactions", "Prototyping", "Motion"],
  },
  "Design Systems Designer": {
    group: "Design",
    Tool: ["Figma", "Storybook", "Zeroheight"],
    Method: ["Design Tokens", "Component Governance", "Documentation"],
  },
  "Design Engineer": {
    group: "Design",
    Language: ["JavaScript", "TypeScript", "HTML/CSS"],
    Framework: ["React", "Tailwind CSS"],
    Tool: ["Figma", "Storybook", "Git"],
    Method: ["Prototyping", "Design Systems"],
  },
  "Content Designer": {
    group: "Design",
    Tool: ["Figma", "Notion", "Ditto"],
    Method: ["UX Writing", "Content Strategy", "Microcopy"],
  },
  "Visual Designer": {
    group: "Design",
    Tool: ["Adobe Photoshop", "Illustrator", "InDesign", "Figma"],
    Method: ["Branding", "Layout", "Marketing Assets"],
  },
  "Motion Designer": {
    group: "Design",
    Tool: ["After Effects", "Lottie", "Figma", "Rive", "Cinema 4D"],
    Method: ["Animation", "Micro-interactions"],
  },
  // ---- Leadership ----
  "Tech Lead": {
    group: "Leadership",
    Language: ["TypeScript", "Python", "Go"],
    Framework: ["React", "Node.js"],
    Tool: ["Git", "Jira"],
    Method: ["System Design", "Code Review", "Mentoring"],
  },
  "Staff Engineer": {
    group: "Leadership",
    Language: ["Go", "Python", "Java"],
    Tool: ["Git", "Docker", "Kubernetes"],
    Platform: ["AWS", "GCP", "Azure"],
    Method: ["Architecture", "Technical Strategy", "System Design"],
  },
  "Engineering Manager": {
    group: "Leadership",
    Tool: ["Jira", "Linear", "GitHub"],
    Method: ["People Management", "Delivery", "Hiring", "Agile/Scrum"],
  },
  "Solutions Architect": {
    group: "Leadership",
    Language: ["Java", "C#", "Python", "Go"],
    Framework: ["Spring Boot", ".NET", "Microservices"],
    Tool: ["Terraform", "Lucidchart", "Git"],
    Platform: ["AWS", "GCP", "Azure"],
    Method: ["System Design", "API Design", "Event-Driven Architecture"],
  },
  "Director of Engineering": {
    group: "Leadership",
    Tool: ["Jira", "Linear"],
    Method: ["Org Design", "Technical Strategy", "Budgeting", "Hiring"],
  },
  // ---- Program ----
  "Technical Program Manager": {
    group: "Program",
    Tool: ["Jira", "Confluence", "Smartsheet"],
    Method: ["Cross-team Delivery", "Risk Management", "Roadmapping"],
  },
  "Project Manager": {
    group: "Program",
    Tool: ["Jira", "Asana", "MS Project", "Monday"],
    Method: ["Agile/Waterfall", "Scope/Timeline/Budget"],
  },
  "Scrum Master": {
    group: "Program",
    Tool: ["Jira", "Azure DevOps", "Miro"],
    Method: ["Scrum", "Kanban", "SAFe", "Facilitation"],
  },
  "Solutions Engineer": {
    group: "Program",
    Language: ["SQL", "Python", "JavaScript"],
    Tool: ["Postman", "Demo environments", "Git"],
    Method: ["Pre-sales", "Technical Demos", "Integrations"],
  },
  "Developer Advocate": {
    group: "Program",
    Language: ["JavaScript", "Python", "Go"],
    Tool: ["GitHub", "Docs platforms", "Git"],
    Method: ["Content", "SDK/Sample Code", "Community"],
  },
  "Technical Writer": {
    group: "Program",
    Language: ["Markdown"],
    Framework: ["Docusaurus"],
    Tool: ["Git", "Confluence", "OpenAPI/Swagger"],
    Method: ["API Docs", "Guides", "Tutorials"],
  },
  "Business Analyst": {
    group: "Program",
    Language: ["SQL"],
    Tool: ["Excel", "Jira", "Visio", "BPMN tooling"],
    Method: ["Requirements Gathering", "Process Mapping"],
  },
  // ---- Specialized ----
  "Blockchain Developer": {
    group: "Specialized",
    Language: ["Solidity", "Rust", "TypeScript", "Go"],
    Framework: ["Hardhat", "Foundry", "ethers.js", "Anchor"],
    Tool: ["Git", "MetaMask"],
    Platform: ["Ethereum", "Solana", "Layer 2s"],
  },
  "AR/VR Engineer": {
    group: "Specialized",
    Language: ["C#", "C++"],
    Framework: ["Unity", "Unreal Engine", "ARKit", "ARCore", "OpenXR"],
    Tool: ["Git", "Blender"],
    Platform: ["Meta Quest", "Apple Vision Pro"],
  },
  "Robotics Engineer": {
    group: "Specialized",
    Language: ["C++", "Python"],
    Framework: ["ROS/ROS2", "OpenCV"],
    Tool: ["Gazebo", "MoveIt", "Git"],
    Platform: ["Embedded controllers"],
  },
  "Data Governance Engineer": {
    group: "Specialized",
    Language: ["SQL", "Python"],
    Framework: ["Great Expectations", "dbt"],
    Tool: ["Collibra", "Alation", "Git"],
    Platform: ["Snowflake", "Data catalogs"],
    Method: ["Data Quality", "Lineage", "Governance"],
  },
};

const TAG_ORDER: StackTag[] = ["Language", "Framework", "Database", "Tool", "Platform", "Method"];

export const ROLES: string[] = Object.keys(RAW);

export const ROLE_GROUP_MAP: Record<string, RoleGroup> = Object.fromEntries(
  Object.entries(RAW).map(([r, v]) => [r, v.group])
);

// role -> ordered stack names (deduped)
export const ROLE_STACKS: Record<string, string[]> = Object.fromEntries(
  Object.entries(RAW).map(([role, v]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const tag of TAG_ORDER) {
      const arr = v[tag];
      if (!arr) continue;
      for (const name of arr) {
        if (!seen.has(name)) {
          seen.add(name);
          out.push(name);
        }
      }
    }
    return [role, out];
  })
);

// canonical stack name -> tag (first-seen wins across all roles in TAG_ORDER)
export const STACK_TAGS: Record<string, StackTag> = (() => {
  const map: Record<string, StackTag> = {};
  for (const [, v] of Object.entries(RAW)) {
    for (const tag of TAG_ORDER) {
      const arr = v[tag];
      if (!arr) continue;
      for (const name of arr) {
        if (!(name in map)) map[name] = tag;
      }
    }
  }
  return map;
})();

// Fallback stack list when no role is selected yet.
export const COMMON_STACKS: string[] = [
  "React", "Node.js", "TypeScript", "JavaScript", "Python", "SQL",
  "PostgreSQL", "AWS", "Docker", "Figma", "Git",
];

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
