Implement role-specific stack options in the quiz so step 2 shows tools relevant to the role chosen in step 1.

1. Create a role-to-stacks map
   - Add a `ROLE_STACKS` mapping in `src/routes/quiz.tsx` (or extract into a shared `src/lib/quiz-data.ts` if the matches page will later reuse it).
   - Each role gets a curated list of relevant technologies.
   - Roles that don't fit a specific stack (e.g., Engineering Manager, Technical Writer) fall back to a `COMMON_STACKS` list.
   - Add any missing technologies needed for the mappings (e.g., React Native, Flutter, SwiftUI, Terraform, Tableau, Lovable, Jira, Confluence, Unity, Unreal, Solidity, etc.).

2. Pass the selected role into `StackStep`
   - Change `StackStep` props to include `role: string | undefined`.
   - In `QuizPage`, pass `answers.role` when rendering the stack step.

3. Filter the stack list by role
   - Replace the global `STACK_OPTIONS` filter with `ROLE_STACKS[role] ?? COMMON_STACKS`.
   - Keep the existing search and multi-select behavior unchanged.
   - If the user hasn't selected a role yet, show `COMMON_STACKS` as a safe default.

4. Reset the stack when the role changes
   - In `QuizPage`, when `answers.role` changes, clear `answers.stack` to prevent leftover technologies from a different role.

5. Verify and preview
   - Run a type check.
   - Walk through the quiz in the preview to confirm each role shows the expected stacks.

Proposed mapping (confirm or send edits):

- Frontend Engineer: React, Next.js, Vue, Angular, Svelte, TypeScript, JavaScript, HTML/CSS, Tailwind CSS, Webpack, Vite, Figma, Storybook, Jest, Cypress
- Backend Engineer: Node.js, Python, Go, Java, Ruby, C#, PostgreSQL, MongoDB, Redis, GraphQL, REST API, AWS, GCP, Docker, Kubernetes, Kafka
- Full Stack Engineer: React, Next.js, Node.js, TypeScript, JavaScript, Python, PostgreSQL, MongoDB, GraphQL, AWS, Docker, Kubernetes, Redis
- Mobile Engineer: React Native, Flutter, Swift, Kotlin, Java, iOS, Android, Firebase
- iOS Engineer: Swift, Objective-C, SwiftUI, UIKit, Xcode, Core Data, Combine, Firebase
- Android Engineer: Kotlin, Java, Android Jetpack, Compose, Firebase, Room, Gradle
- Software Engineer: React, Node.js, TypeScript, Python, Go, PostgreSQL, AWS, Docker, Kubernetes, Git
- Staff Engineer: React, Node.js, TypeScript, Python, Go, Java, PostgreSQL, AWS, GCP, Docker, Kubernetes, Kafka, Terraform
- Engineering Manager: Jira, Confluence, Notion, GitHub, Figma, Lovable, Google Analytics, Amplitude, Slack
- Tech Lead: React, Node.js, TypeScript, Python, PostgreSQL, AWS, Docker, Kubernetes, GitHub, Figma, Lovable
- DevOps Engineer / Site Reliability Engineer / Platform Engineer / Cloud Engineer: AWS, GCP, Azure, Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions, CI/CD, Linux, Python, Go, Bash, Prometheus, Grafana
- Security Engineer: Python, Go, Kali Linux, Wireshark, Burp Suite, OWASP, SIEM, AWS, Docker, HashiCorp Vault
- QA Engineer / Test Automation Engineer: Selenium, Cypress, Playwright, Jest, Postman, GitHub Actions, CI/CD, Python, JavaScript, TypeScript
- Data Engineer / Data Scientist / Data Analyst / Analytics Engineer: Python, SQL, PostgreSQL, MySQL, Snowflake, BigQuery, Apache Spark, Kafka, Airflow, dbt, AWS, GCP, Docker, Tableau, Power BI, Excel, Pandas
- Machine Learning Engineer / AI Engineer / MLOps Engineer / Research Engineer: Python, TensorFlow, PyTorch, Scikit-learn, Keras, Jupyter, Pandas, NumPy, SQL, PostgreSQL, AWS, GCP, Docker, Kubernetes, MLflow, LangChain
- Product Manager / Technical Product Manager: Jira, Confluence, Notion, Airtable, Figma, Lovable, Miro, Google Analytics, Amplitude, Mixpanel, Excel
- Product Designer / UX Designer / UI Designer / Design Engineer: Figma, Lovable, Sketch, Adobe XD, Webflow, Framer, Miro, Notion, InVision, Principle, After Effects
- UX Researcher: Miro, Notion, Figma, Lovable, UserTesting, Hotjar, Google Analytics, Excel
- Solutions Architect / Systems Architect: AWS, GCP, Azure, Kubernetes, Docker, Terraform, Kafka, PostgreSQL, Redis, GraphQL, REST API, Python, Go
- Database Administrator: PostgreSQL, MySQL, SQL Server, Oracle, MongoDB, Redis, AWS RDS, GCP Cloud SQL, Terraform, Linux, Python
- Embedded Engineer / Firmware Engineer: C, C++, Rust, MicroPython, Arduino, Raspberry Pi, RTOS, FPGA, Verilog, KiCad, MATLAB
- Game Developer: Unity, Unreal Engine, C#, C++, Blender, Godot, OpenGL, DirectX, Maya, 3ds Max
- Blockchain Engineer: Solidity, Rust, Go, Ethereum, Web3.js, Hardhat, Truffle, Smart Contracts, IPFS, Node.js, Python
- Developer Advocate: GitHub, Markdown, Notion, Figma, Lovable, OBS, YouTube, Discord, Slack
- Technical Writer: Markdown, Notion, Confluence, GitHub, Figma, Lovable, Google Docs, Swagger, YAML
- IT Support Engineer: Windows, macOS, Linux, Active Directory, Okta, ServiceNow, Jira, Slack, Microsoft 365, Google Workspace, Bash, PowerShell

Fallback `COMMON_STACKS` (for any role not listed): React, Node.js, TypeScript, JavaScript, Python, SQL, PostgreSQL, AWS, Docker, Figma, Git