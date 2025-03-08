Overall Website Functionality
Login Process

Login Page: The user enters a username and password for authentication.
Successful Authentication: Redirects to the MyPage screen.
MyPage Screen

Top/Main Area: Displays the main operational interface after login.
Left-side Menu (arranged from top to bottom):
Workspace Name
App
Table
Endpoint
MessageBlocker
API Key
File Management
Migration
Bottom-left Popup Information:
When clicked, a popup displays:
User's Name
Email Address
Company Name
Role (e.g., System Administrator)
Last Login Time
Links for Personal Settings, Resource Management, and Administration Settings
Workspace Dropdown Selection

Clicking the Workspace Name shows a dropdown list displaying all the workspaces accessible by the user.
Detailed Settings Pages for Each Module

When clicking any item in the left-side menu (App, Table, Endpoint, MessageBlocker, API Key, File Management, Migration), the main area displays the corresponding settings page.
Detailed Descriptions of Each Module
App Module

Page Layout: Displays each app's status and name in a vertical list.
Status: Each app shows either "Running" or "Stopped" status.
Action Buttons:
Each app includes options for Delete and Edit.
A "New App" button is available on the page to create a new app.
Table Module

Page Layout:
The left side displays a list of all tables.
The right side shows detailed information of the selected table.
Operations: Users can Add, Edit, and Delete custom tables.
Endpoint Module

Top of the Page: Contains two switchable menu options:
Data Input (HTTP)
Table API
Operations:
In the Data Input (HTTP) mode, users can add, delete, and edit APIs.
In the Table API mode, users can add, delete, and edit table APIs.
MessageBlocker Module

Page Content: Mainly displays settings related to the MQTT Blocker.
Settings Include:
UserName
Password
IP-Whitelist
Description
Number of Topics
Operations: Add, edit, and delete MQTT Blocker configurations.
API Key Module

Page Content: Displays a list of API keys.
Operations: Users can Add, Edit, and Delete custom API keys.
Each API Key Includes:
API Key Name
The Endpoint in Use
Expiration Date
File Management Module

Page Content: Displays a list of files.
File Information:
File Name
Creation Date
Creator
Status (e.g., whether it has been updated, the app it's being used in)
Operations:
Upload Files
Download Files
Delete Files
Migration Module

Top of the Page: Contains two switchable menu options:
Export
Import
Operations:
Export: Users can export apps, tables, and table data.
Import: Users can import apps and tables.
Technology Stack and Data Interaction Requirements
Technology Stack: Develop the front-end using Vue3 + TypeScript to build a modern, component-based application.
Data Interaction: Use json-server to simulate real API calls for data addition, deletion, and modification. This will support fetching, editing, and deleting data for all the above modules.