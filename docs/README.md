---
layout: home
permalink: index.html

# Please update this with your repository name and title
repository-name: e21-co227-Crowd-Balance-Mobile-App
title: EngEx Crowd Balance Mobile App
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template"

# **EngEx Crowd Balance Mobile App**

---

<!-- 
This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/)

![Sample Image](./images/sample.png)
 -->

![Logo](./images/logo.png)



## Table of Contents
1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Software Architecture](#software-architecture)
4. [Deployment](#deployment)
5. [User Manual](#user-manual)
6. [Team](#team)
6. [Links](#links)

---

## Introduction

A smart crowd management mobile app developed for the **75th Anniversary Exhibition (PeraVerse)** at the University of Peradeniya. The EngEx Crowd Balance Mobile App offers real-time crowd monitoring, missing person alerts, car park tracking, and AI chatbot support to ensure efficient event management.

**Project Goals:**
- Efficiently monitor and manage crowd flow across the exhibition
- Quickly locate and assist missing persons
- Ensure smooth communication between organizers and main panel
- Optimize car park and hall usage to prevent overcrowding
- Provide real-time data to improve decision-making during the event

**Technology Stack:** React Native, Expo, MongoDB, Express.js, and Node.js

## Key Features

#### 1. Real-Time Crowd Management System

The app supports two types of users: **Organizers** and **Main Panel**.

- **Update Current Crowd Status (Organizers)**: Organizers can instantly update crowd status based on current conditions at their assigned locations.

- **Assign Organizers to High-Crowded Areas (Main Panel)**: The main panel receives real-time crowd data and can efficiently assign available organizers to specific locations based on current needs.

- **Send Actionable Notifications**: The system directly notifies organizers of their new location assignments and critical crowd levels, prompting rapid and informed responses.

### 2. Missing Person Alert System

- **Create Missing Person Alerts**: Any authorized user can create a new missing person alert by filling in crucial details including:
  - Name, Age, Gender
  - Last seen location
  - Photo (optional)
  - Description summary (optional)

- **Real-Time Alert Display**: Once created, the alert is immediately visible to all teams, displaying the person's details and last known location.

- **Mark as Found**: With a single tap, users can mark the person as "FOUND," instantly closing the alert loop and notifying all relevant parties.

### 3. Car Park Management System

- **Real-Time Status Dashboard**: Gain instant visibility into the real-time status of all parking areas, clearly showing capacity and availability for each lot.

- **Update Car Park Count (Organizers)**: Organizers on the ground can quickly adjust vehicle counts using '+' and '-' buttons as cars enter and exit, ensuring accurate status updates and preventing overcrowding.

- **Add and Remove Car Parks (Main Panel)**: The main panel can dynamically manage parking areas based on exhibition requirements.

### 4. AI Chatbot (Web App Feature)

- **Instant Support**: Provides instant access to critical event information through a built-in chatbot powered by n8n workflow automation.
- **Knowledge Base Assistant**: Capable of answering common questions such as event schedules, location details, and general exhibition information.



## Software Architecture

### Three-Tier Architecture

**Frontend (React Native + Expo):**
- Interactive dashboards for organizers and main panel users
- File-based navigation using Expo Router for clean, maintainable routing
- Styling with TailwindCSS core utility classes

**Backend (Node.js + Express.js):**
- RESTful API handling logic, authentication, and data flow
- MVC (Model-View-Controller) architecture pattern for organized, maintainable, and scalable code
- Hosted on Microsoft Azure for reliable performance

**Database (MongoDB Atlas):**
- Cloud-based, secure data storage


## Deployment

### Mobile App
- **Platform**: Built using Expo
- **Availability**: 
  - Android APK (fully built and tested)
  - Expo Go client (iOS and Android)
  
**Download Android APK:**
Click here to Download the APK
[DOWNLOAD APP](https://expo.dev/accounts/ridmal/projects/engex/builds/3536c7f0-b193-4842-bd56-1c829f0f3b87)

![APP DOWNLOAD QR](./images/appQR.jpeg)
Sacn QR to Download the APK

*Note: iOS deployment was successfully tested via Expo Go app, but a dedicated iOS IPA was not built due to platform constraints and limitations.*

### Backend
- **Hosting**: Microsoft Azure (Students)

### API Documentation
- **Postman Collection**: [API Documentation](https://documenter.getpostman.com/view/46290310/2sB3WyLcrR)

### Database
- **Service**: MongoDB Atlas (cloud-based, managed database)



## User Manual

**Download the complete user manual:**

[Download User Manual](https://drive.google.com/file/d/1dw1LBgS6EGVkgbEBqbtrZWBs5dw8K5lw/view?usp=sharing)

*Click the link above to access the complete user manual with step-by-step instructions for using the EngEx Crowd Balance Mobile App.*


## Team
-  E/21/444, Wijesinghe R.M.S.D, [e21444@eng.pdn.ac.lk](mailto:e21444@eng.pdn.ac.lk)
-  E/21/045, Baines S.M, [e21045@eng.pdn.ac.lk](mailto:e21045@eng.pdn.ac.lk)
-  E/21/065, Chamod S.A.R, [e21065@eng.pdn.ac.lk](mailto:e21065@eng.pdn.ac.lk)
-  E/21/277, Padukka V.K, [e21277@eng.pdn.ac.lk](mailto:e21277@eng.pdn.ac.lk)

## Supervisors
- Ms. Yasodha Vimukthi, [yasodhav@eng.pdn.ac.lk](mailto:yasodhav@eng.pdn.ac.lk)



## Links

- [Project Repository](https://github.com/cepdnaclk/e21-co227-Crowd-Balance-Mobile-App)
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)


[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
