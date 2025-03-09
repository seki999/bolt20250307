Modify the implementation by removing the logic related to the main page of the Resource Management feature.

The original main page had a menu with three tabs:

Tenant Management
Workspace Management
User Management
Each tab displayed a corresponding list with specific columns:

Tenant Management Tab

Displayed a Tenant List with the following columns:
tenantName
Company Name
Created Date
Created By
Number of Workspaces / Workspace Limit
Number of Users / User Limit
Status
Actions (Stop / Edit / Delete)
Workspace Management Tab

Displayed a Workspace List with the following columns:
workspaceName
workspaceID
workspaceKey
Type
Created Date
Created By
Max Simultaneous Apps
Assigned / Unassigned Count
Actions (Assigned / Unassign)
User Management Tab

Displayed a User List with the following columns:
userName
Email Address
Number of Tenants
Status
Last Login
Actions (Delete / Reissue)
Remove all references to this logic while ensuring that the rest of the system remains functional.

The Tenant Management List data is not being loaded. Update the implementation to ensure the data is retrieved correctly by adding the necessary entries in the local db.json file.

Add a button above the Tenant Management List to allow the creation of a new Tenant. Implement the necessary functionality to handle the creation process.