import Login from '../views/Login.vue'
import MyPage from '../views/MyPage.vue'
import PersonalSettings from '../views/PersonalSettings.vue'
import ResourceManagement from '../views/ResourceManagement.vue'
import AdminSettings from '../views/AdminSettings.vue'
import AppModule from '../views/modules/AppModule.vue'
import TableModule from '../views/modules/TableModule.vue'
import EndpointModule from '../views/modules/EndpointModule.vue'
import MessageBlockerModule from '../views/modules/MessageBlockerModule.vue'
import ApiKeyModule from '../views/modules/ApiKeyModule.vue'
import FileManagementModule from '../views/modules/FileManagementModule.vue'
import MigrationModule from '../views/modules/MigrationModule.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: MyPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'App' }
      },
      {
        path: 'app',
        name: 'App',
        component: AppModule
      },
      {
        path: 'table',
        name: 'Table',
        component: TableModule
      },
      {
        path: 'endpoint',
        name: 'Endpoint',
        component: EndpointModule
      },
      {
        path: 'messageblocker',
        name: 'MessageBlocker',
        component: MessageBlockerModule
      },
      {
        path: 'apikey',
        name: 'ApiKey',
        component: ApiKeyModule
      },
      {
        path: 'filemanagement',
        name: 'FileManagement',
        component: FileManagementModule
      },
      {
        path: 'migration',
        name: 'Migration',
        component: MigrationModule
      },
      {
        path: 'personal-settings',
        name: 'PersonalSettings',
        component: PersonalSettings
      },
      {
        path: 'resource-management',
        name: 'ResourceManagement',
        component: ResourceManagement
      },
      {
        path: 'admin-settings',
        name: 'AdminSettings',
        component: AdminSettings
      }
    ]
  }
]

export default routes