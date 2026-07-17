# Tech Roles & Stack Taxonomy — Jobly

Data for the quiz (Step 1: role multiselect, max 3 · Step 2: stack chips) and the
keyword layer of the match-engine.

**Chip tags** (the `etc.` label shown on each stack chip):
`Language` · `Framework` · `Database` · `Tool` · `Platform` · `Method`

Labels are **canonical and consistent across roles** — the same technology uses the exact
same string everywhere, so a chip shared by two selected roles renders once and maps to
both under the hood. (Framework folds in libraries; Method covers non-code practices for
product/design/GRC roles.)

Validated against the Stack Overflow 2025 Developer Survey and 2026 role/skill guides
across data, AI, product, design, security and infrastructure.

---

## 1. Engineering

### Frontend Engineer
- **Language:** JavaScript, TypeScript, HTML/CSS
- **Framework:** React, Next.js, Vue, Angular, Svelte, Tailwind CSS, Redux
- **Tool:** Git, Vite, Webpack, Storybook, Figma, Playwright, Cypress
- **Platform:** Vercel, Netlify, Cloudflare

### Backend Engineer
- **Language:** Python, Java, Go, C#, Ruby, PHP, TypeScript, Rust
- **Framework:** Node.js, Express, NestJS, Django, FastAPI, Flask, Spring Boot, .NET, Rails, Laravel, GraphQL
- **Database:** PostgreSQL, MySQL, MongoDB, Redis
- **Tool:** Git, Docker, Kafka, RabbitMQ
- **Platform:** AWS, GCP, Azure

### Full-Stack Engineer
- **Language:** TypeScript, JavaScript, Python, Go, Ruby, HTML/CSS
- **Framework:** React, Next.js, Node.js, Express, NestJS, Django, Rails, GraphQL, Tailwind CSS
- **Database:** PostgreSQL, MySQL, MongoDB, Redis
- **Tool:** Git, Docker, Prisma
- **Platform:** Vercel, Supabase, Firebase, AWS

### Software Engineer (General)
- **Language:** Python, Java, C++, C#, Go, JavaScript, TypeScript, SQL
- **Framework:** Spring Boot, .NET, Django, React, Node.js
- **Database:** PostgreSQL, MySQL
- **Tool:** Git, Docker, Kubernetes
- **Platform:** AWS, GCP, Azure

### Mobile Engineer — iOS
- **Language:** Swift, Objective-C
- **Framework:** SwiftUI, UIKit, Combine
- **Tool:** Xcode, Swift Package Manager, CocoaPods, Git
- **Platform:** App Store, TestFlight, Firebase

### Mobile Engineer — Android
- **Language:** Kotlin, Java
- **Framework:** Jetpack Compose, Coroutines, Retrofit, Room
- **Tool:** Android Studio, Gradle, Dagger/Hilt, Git
- **Platform:** Google Play, Firebase

### Mobile Engineer — Cross-platform
- **Language:** Dart, TypeScript, JavaScript, C#
- **Framework:** Flutter, React Native, Expo, .NET MAUI, Ionic
- **Tool:** Git, Xcode, Android Studio
- **Platform:** App Store, Google Play, Firebase, RevenueCat

### Web Developer
- **Language:** HTML/CSS, JavaScript, PHP, TypeScript
- **Framework:** WordPress, React, Vue, Tailwind CSS, Bootstrap, jQuery
- **Tool:** Git, Webflow, Shopify
- **Platform:** Netlify, Vercel

### Game Developer
- **Language:** C++, C#, Lua, Python
- **Framework:** Unity, Unreal Engine, Godot
- **Tool:** Blender, Git, DirectX, OpenGL, Vulkan
- **Platform:** Steam

### Embedded / Firmware Engineer
- **Language:** C, C++, Rust, Assembly
- **Framework:** FreeRTOS, Zephyr
- **Tool:** STM32, ESP32, JTAG, I2C/SPI/UART, Git
- **Platform:** Linux (embedded), Yocto

### Systems / Low-level Engineer
- **Language:** C, C++, Rust, Go, Assembly
- **Framework:** POSIX, eBPF
- **Tool:** LLVM, gdb, perf, Git
- **Platform:** Linux, Unix

### Desktop / Enterprise Application Developer
- **Language:** C#, Java, C++, JavaScript, TypeScript
- **Framework:** .NET, WPF, Electron, Qt, Spring Boot
- **Database:** SQL Server, PostgreSQL, Oracle
- **Tool:** Git, Visual Studio
- **Platform:** Windows, Azure

---

## 2. Data & AI / ML

### Data Analyst
- **Language:** SQL, Python, R
- **Framework:** pandas
- **Database:** PostgreSQL, Snowflake, BigQuery
- **Tool:** Excel, Tableau, Power BI, Looker, dbt
- **Method:** A/B Testing, Data Visualization

### Data Scientist
- **Language:** Python, R, SQL
- **Framework:** pandas, NumPy, scikit-learn, XGBoost, statsmodels
- **Database:** Snowflake, BigQuery, PostgreSQL
- **Tool:** Jupyter, Matplotlib, Git
- **Platform:** Databricks, SageMaker
- **Method:** Statistical Modeling, A/B Testing

### Data Engineer
- **Language:** Python, SQL, Scala, Java
- **Framework:** Apache Spark, Airflow, dbt, Kafka, Flink
- **Database:** Snowflake, BigQuery, Redshift, PostgreSQL
- **Tool:** Git, Docker
- **Platform:** Databricks, AWS, GCP, Azure

### Analytics Engineer
- **Language:** SQL, Python
- **Framework:** dbt
- **Database:** Snowflake, BigQuery, Redshift
- **Tool:** Looker, Fivetran, Airbyte, Dagster, Git
- **Method:** Data Modeling

### Machine Learning Engineer
- **Language:** Python, C++, Go
- **Framework:** PyTorch, TensorFlow, scikit-learn, Hugging Face, Ray
- **Tool:** MLflow, Docker, Kubernetes, Git, ONNX
- **Platform:** SageMaker, Vertex AI, AWS, GCP

### AI / LLM Engineer
- **Language:** Python, TypeScript
- **Framework:** PyTorch, Hugging Face, LangChain, LangGraph, LlamaIndex, FastAPI
- **Database:** pgvector, Pinecone, Weaviate, Chroma
- **Tool:** OpenAI API, Anthropic API, LangSmith, vLLM, Docker, Git, MCP
- **Platform:** AWS, GCP, Modal, Replicate
- **Method:** Prompt Engineering, RAG, Evals, Agents

### ML / AI Research Scientist
- **Language:** Python
- **Framework:** PyTorch, JAX, TensorFlow
- **Tool:** CUDA, Weights & Biases, Git
- **Platform:** GPU/TPU clusters, HPC
- **Method:** Deep Learning, Experimentation

### MLOps Engineer
- **Language:** Python, Go, Bash
- **Framework:** MLflow, Kubeflow, BentoML, Ray
- **Tool:** Docker, Kubernetes, Terraform, Git
- **Platform:** SageMaker, Vertex AI, AWS, GCP
- **Method:** CI/CD, Model Monitoring

### Computer Vision Engineer
- **Language:** Python, C++
- **Framework:** OpenCV, PyTorch, TensorFlow, YOLO
- **Tool:** CUDA, Git
- **Platform:** GPU servers, Edge devices
- **Method:** Deep Learning

### NLP Engineer
- **Language:** Python
- **Framework:** Hugging Face, spaCy, NLTK, PyTorch
- **Database:** pgvector, Pinecone
- **Tool:** Git, Docker
- **Method:** RAG, Text Processing

### BI Developer / Analyst
- **Language:** SQL, DAX
- **Database:** SQL Server, Snowflake, BigQuery
- **Tool:** Power BI, Tableau, Looker
- **Method:** Data Modeling, Dashboarding

### Data Architect
- **Language:** SQL, Python
- **Framework:** Apache Spark, dbt
- **Database:** Snowflake, BigQuery, PostgreSQL, Redshift
- **Tool:** Git, data catalogs
- **Platform:** AWS, GCP, Azure, Databricks
- **Method:** Data Modeling, Schema Design

### Database Administrator (DBA)
- **Language:** SQL, PL/SQL, Bash
- **Database:** PostgreSQL, MySQL, Oracle, SQL Server, MongoDB
- **Tool:** Git, backup/replication tooling
- **Platform:** AWS RDS, Cloud SQL

---

## 3. Infrastructure, DevOps & Cloud

### DevOps Engineer
- **Language:** Bash, Python, Go, YAML
- **Tool:** Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions, GitLab CI, ArgoCD, Helm, Git
- **Platform:** AWS, GCP, Azure
- **Method:** CI/CD, Infrastructure as Code

### Site Reliability Engineer (SRE)
- **Language:** Go, Python, Bash
- **Tool:** Kubernetes, Prometheus, Grafana, Terraform, PagerDuty, OpenTelemetry, Git
- **Platform:** AWS, GCP, Azure
- **Method:** Observability, Incident Response

### Platform Engineer
- **Language:** Go, Python, TypeScript
- **Tool:** Kubernetes, Terraform, Backstage, Crossplane, ArgoCD, Helm, Git
- **Platform:** AWS, GCP
- **Method:** Infrastructure as Code, Developer Experience

### Cloud Engineer / Architect
- **Language:** Python, Go, Bash
- **Tool:** Terraform, CloudFormation, Pulumi, Kubernetes, Git
- **Platform:** AWS, Azure, GCP
- **Method:** Infrastructure as Code, System Design

### Infrastructure Engineer
- **Language:** Python, Go, Bash
- **Tool:** Terraform, Ansible, Packer, Docker, Kubernetes, Git
- **Platform:** AWS, GCP, Azure, VMware
- **Method:** Infrastructure as Code

### Network Engineer
- **Language:** Python, Bash
- **Tool:** Cisco IOS, Juniper, Wireshark, SD-WAN
- **Method:** BGP/OSPF, VPN, Network Design

### Systems Administrator
- **Language:** Bash, PowerShell, Python
- **Tool:** Linux, Windows Server, Active Directory, Ansible, Nagios
- **Platform:** On-prem, hybrid cloud

---

## 4. Security

### Security Engineer
- **Language:** Python, Go, Bash
- **Tool:** Burp Suite, Nmap, Metasploit, SIEM, Terraform, Git
- **Platform:** AWS, GCP, Azure
- **Method:** Threat Modeling, Vulnerability Management

### Application Security (AppSec) Engineer
- **Language:** Python, JavaScript, Java
- **Tool:** Snyk, Semgrep, Checkmarx, Burp Suite, OWASP ZAP, Git
- **Method:** SAST/DAST, Threat Modeling, Secure Code Review

### Cloud Security Engineer
- **Language:** Python, Go
- **Tool:** Wiz, Prisma Cloud, AWS GuardDuty, Terraform, Git
- **Platform:** AWS, Azure, GCP
- **Method:** IAM, Zero Trust, Posture Management

### Penetration Tester / Red Team
- **Language:** Python, Bash, PowerShell
- **Tool:** Metasploit, Burp Suite, Nmap, Kali Linux, Cobalt Strike, Wireshark
- **Method:** Penetration Testing, OSINT, Exploit Development

### Security / SOC Analyst
- **Language:** SQL, Python
- **Tool:** Splunk, Microsoft Sentinel, CrowdStrike, QRadar, Wireshark
- **Method:** Incident Response, Threat Hunting, MITRE ATT&CK

### GRC / Security Compliance
- **Tool:** Vanta, Drata, Jira
- **Method:** SOC 2, ISO 27001, NIST, GDPR, HIPAA, Risk Assessment, Audit

### Incident Response / Threat Intelligence
- **Language:** Python, Bash
- **Tool:** Splunk, CrowdStrike, Microsoft Sentinel, EDR/XDR
- **Method:** Incident Response, Threat Hunting, Forensics, MITRE ATT&CK

---

## 5. QA & Testing

### QA Engineer (Manual)
- **Tool:** TestRail, Jira, Zephyr, Postman
- **Method:** Test Case Design, Regression Testing, Exploratory Testing

### QA Automation Engineer
- **Language:** JavaScript, TypeScript, Python, Java
- **Framework:** Selenium, Playwright, Cypress, Appium, pytest
- **Tool:** GitHub Actions, Jenkins, Git
- **Method:** Test Automation

### SDET
- **Language:** Java, Python, TypeScript, C#
- **Framework:** Selenium, Playwright, REST Assured, JUnit, k6, Gatling
- **Tool:** GitHub Actions, Jenkins, Git
- **Method:** Test Automation, Performance Testing

---

## 6. Product

### Product Manager
- **Tool:** Jira, Linear, Amplitude, Mixpanel, Figma, Notion, Productboard
- **Method:** Roadmapping, Discovery, A/B Testing, Prioritization (RICE), User Research

### Technical Product Manager
- **Language:** SQL
- **Tool:** Jira, Postman, Amplitude, Figma
- **Method:** API/Platform Strategy, Technical PRDs, System Design Literacy

### Growth Product Manager
- **Language:** SQL
- **Tool:** Amplitude, Mixpanel, Optimizely, Braze
- **Method:** Funnel Optimization, Experimentation, Retention/Activation Loops

### AI / ML Product Manager
- **Tool:** Amplitude, LLM APIs, Jupyter, Notion
- **Method:** Eval Design, Model UX, AI Literacy, Roadmapping

### Data Product Manager
- **Language:** SQL
- **Tool:** Amplitude, Looker, Jira
- **Method:** Data Strategy, Metrics Design, Experimentation

### Product Owner
- **Tool:** Jira, Azure DevOps, Confluence
- **Method:** Backlog Management, Scrum, User Stories

### Product Marketing Manager
- **Tool:** HubSpot, Amplitude, Notion, Figma
- **Method:** Positioning, GTM Strategy, Messaging, Competitive Analysis

---

## 7. Design

### Product Designer
- **Tool:** Figma, FigJam, Framer, Notion
- **Method:** End-to-end UX/UI, Prototyping, Design Systems, User Research

### UX Designer
- **Tool:** Figma, Sketch, Adobe XD, Maze
- **Method:** Wireframing, User Flows, Information Architecture, Usability Testing

### UI Designer
- **Tool:** Figma, Sketch, Adobe XD, Photoshop, Illustrator
- **Method:** Visual Design, Component Libraries, Responsive Layout

### UX Researcher
- **Tool:** Maze, UserTesting, Dovetail, Optimal Workshop, Lookback
- **Method:** User Interviews, Usability Testing, Surveys, Research Synthesis

### Interaction Designer
- **Tool:** Figma, Framer, Principle, ProtoPie
- **Method:** Micro-interactions, Prototyping, Motion

### Design Systems Designer
- **Tool:** Figma, Storybook, Zeroheight
- **Method:** Design Tokens, Component Governance, Documentation

### UX Engineer / Design Engineer
- **Language:** JavaScript, TypeScript, HTML/CSS
- **Framework:** React, Tailwind CSS
- **Tool:** Figma, Storybook, Git
- **Method:** Prototyping, Design Systems

### Content Designer / UX Writer
- **Tool:** Figma, Notion, Ditto
- **Method:** UX Writing, Content Strategy, Microcopy

### Visual / Graphic Designer
- **Tool:** Adobe Photoshop, Illustrator, InDesign, Figma
- **Method:** Branding, Layout, Marketing Assets

### Motion Designer
- **Tool:** After Effects, Lottie, Figma, Rive, Cinema 4D
- **Method:** Animation, Micro-interactions

---

## 8. Engineering Leadership & Architecture

### Tech Lead
- **Language:** (mirrors team stack, e.g. TypeScript, Python, Go)
- **Framework:** React, Node.js
- **Tool:** Git, Jira
- **Method:** System Design, Code Review, Mentoring

### Staff / Principal Engineer
- **Language:** (deep in domain, e.g. Go, Python, Java)
- **Tool:** Git, Docker, Kubernetes
- **Platform:** AWS, GCP, Azure
- **Method:** Architecture, Technical Strategy, System Design

### Engineering Manager
- **Tool:** Jira, Linear, GitHub
- **Method:** People Management, Delivery, Hiring, Agile/Scrum

### Software / Solutions Architect
- **Language:** Java, C#, Python, Go
- **Framework:** Spring Boot, .NET, microservices
- **Tool:** Terraform, Lucidchart, Git
- **Platform:** AWS, GCP, Azure
- **Method:** System Design, API Design, Event-Driven Architecture

### Director / VP Engineering / CTO
- **Tool:** Jira, Linear
- **Method:** Org Design, Technical Strategy, Budgeting, Hiring

---

## 9. Program, Project & Technical-Adjacent

### Technical Program Manager (TPM)
- **Tool:** Jira, Confluence, Smartsheet
- **Method:** Cross-team Delivery, Risk Management, Roadmapping

### Project Manager (Tech)
- **Tool:** Jira, Asana, MS Project, Monday
- **Method:** Agile/Waterfall, Scope/Timeline/Budget

### Scrum Master / Agile Coach
- **Tool:** Jira, Azure DevOps, Miro
- **Method:** Scrum, Kanban, SAFe, Facilitation

### Solutions Engineer / Sales Engineer
- **Language:** SQL, Python, JavaScript
- **Tool:** Postman, demo environments, Git
- **Method:** Pre-sales, Technical Demos, Integrations

### Developer Advocate (DevRel)
- **Language:** JavaScript, Python, Go
- **Tool:** GitHub, docs platforms, Git
- **Method:** Content, SDK/Sample Code, Community

### Technical Writer
- **Language:** Markdown
- **Framework:** Docusaurus
- **Tool:** Git, Confluence, OpenAPI/Swagger
- **Method:** API Docs, Guides, Tutorials

### Business / Systems Analyst
- **Language:** SQL
- **Tool:** Excel, Jira, Visio, BPMN tooling
- **Method:** Requirements Gathering, Process Mapping

---

## 10. Emerging / Specialized

### Blockchain / Web3 Developer
- **Language:** Solidity, Rust, TypeScript, Go
- **Framework:** Hardhat, Foundry, ethers.js, Anchor
- **Tool:** Git, MetaMask
- **Platform:** Ethereum, Solana, Layer 2s

### AR / VR / XR Engineer
- **Language:** C#, C++
- **Framework:** Unity, Unreal Engine, ARKit, ARCore, OpenXR
- **Tool:** Git, Blender
- **Platform:** Meta Quest, Apple Vision Pro

### Robotics Engineer
- **Language:** C++, Python
- **Framework:** ROS/ROS2, OpenCV
- **Tool:** Gazebo, MoveIt, Git
- **Platform:** Embedded controllers

### Data Governance / Data Quality Engineer
- **Language:** SQL, Python
- **Framework:** Great Expectations, dbt
- **Tool:** Collibra, Alation, Git
- **Platform:** Snowflake, data catalogs
- **Method:** Data Quality, Lineage, Governance
