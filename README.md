<h1 align="center" style="font-size: 3em; font-weight: bold; color: #2c3e50;">Finance Bros</h1>

<p align="center" style="font-size: 2em;">Your personal finance companion, built for the future.</p>

## Description
Finance Bros is a sleek and powerful budget tracking application designed to help users take control of their personal finances. Built with the high-performance Astro.js framework, this web app offers a smooth, efficient user experience on both desktop and mobile devices. Whether you're a student managing your first budget or a seasoned saver optimizing your expenses, Finance Bros provides the tools you need to stay on top of your financial goals.

Created as a submission to the RRHS Congressional App Challenge, the app blends practical features with an engaging, modern design to make budgeting accessible and enjoyable.

### Key Features
- Real-time budget tracking
- intuitive dashboards
- Interactive visualizations for spending insights
- Fully responsive UI with dark mode support
- Personalized alerts for overspending or upcoming payments

## Checklist
- [x] User authentication and account creation  
- [ ] Dashboard for tracking expenses and income  
- [ ] Interactive charts and graphs (e.g., pie chart, bar graph)  
- [x] Responsive mobile and desktop design  
- [x] Local storage and/or backend data persistence  
- [ ] Monthly budget planning and tracking tools  
- [x] Categorization of transactions  
- [x] Clean UI/UX design with accessibility in mind   
- [ ] Dark mode and theme toggling

## Dependencies
- [Node.js](https://nodejs.org/en/download)

## Get Started
- Install Chocolatey (Windows Only)
- Install Node.js (20.x.x for best compatibility)
- Run the Following Command:
```
npm install
```
- Locate a Serverless Postgres Database (Neon Recommended)
- Create a .env file with the Following:
```
DATABASE_URL=  // Should be in the format: "postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]"
JWT_SECRET=  // Random string of alphanumeric characters; the longer the better
```
- Finally, run this Command to Access the Website
```
npm run dev
```
