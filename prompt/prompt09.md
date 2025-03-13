Tenant Management List:

Add a dropdown arrow on the left side of each Tenant row in the list.
When clicking the arrow, expand a sub-list showing the Workspaces under that Tenant.
The sub-list should contain the following columns:
Logical Workspace Name
Type (Dedicated/Shared)
Created Date
Created By
Max Simultaneous Apps
Running Apps Count
Status


In the Workspace Management List, 
Rename the current Workspace to Physical Workspace.
add a dropdown arrow on the left side of each Physical Workspace row.
When clicking the arrow, expand a sub-list displaying the Logical Workspaces under that Physical Workspace.
Sub-list Columns for Logical Workspaces:
Logical Workspace Name
Belonging Tenant
Created Date
Created By
Max Simultaneous Apps
Running Apps Count
Status
Actions (Delete / Edit)
Ensure that the UI dynamically updates when expanding or collapsing the Logical Workspaces under each Physical Workspace

In the Message Blockers main screen, there are two tabs:

Access Control
Server Info
When clicking Access Control, a list screen appears with the following columns:
Username
Password
IP Whitelist
Description
Number of Topics
Actions (Edit / Delete)
When clicking Server Info, a list screen appears with the following columns:
Server Configuration Information
Configuration Value
Ensure proper UI implementation for switching between tabs and displaying the corresponding list.

In the Message Blockers list, add a dropdown arrow on the left side of each row.

Functionality:
When clicking the arrow, a sub-list should expand below the row.
The sub-list should display the following columns:
Topic
Description
Permissions
Actions (Delete / Edit)
Ensure that the UI properly handles expanding and collapsing the sub-list dynamically.

Modify the Message Blockers list behavior by removing the Edit and Delete actions from the sub-list.

Changes:
The sub-list under each row should still display:
Topic
Description
Permissions
However, the editing of sub-list items should now be handled within the Edit function of the parent list item.
Ensure the Edit functionality in the parent list allows modifications to the corresponding sub-list items.

In the Message Blockers list screen, when clicking the "New MQTT Blocker" button, a data entry modal should appear.

The modal should contain input fields for the following:
Username
Password
IP Whitelist
Description
Number of Topics
Topic
Topic Description
Permissions
Ensure that the modal properly collects and saves the entered data upon submission.