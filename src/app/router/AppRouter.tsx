import { lazy, Suspense } from 'react'
import AdminGuard from '../../widgets/layout/AdminGuard'
import AdminLayout from '../../widgets/layout/AdminLayout'
import ClientLayout from '../../widgets/layout/ClientLayout'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom'

const AdminUploadPage = lazy(() => import('../../pages/admin/AdminUploadPage'))
const AdminBoard = lazy(() => import('../../pages/admin/AdminBoard'))
const AdminManagePage = lazy(() => import('../../pages/admin/AdminManagePage'))
const ClientNailDetailPage = lazy(() => import('../../pages/client/ClientNailDetailPage'))
const ClientGalleryPage = lazy(() => import('../../pages/client/ClientGalleryPage'))
const ClientRankingPage = lazy(() => import('../../pages/client/ClientRankingPage'))
const ClientMagazinePage = lazy(() => import('../../pages/client/magazine/ClientMagazinePage'))
const ClientMagazineDetailPage = lazy(() => import('../../pages/client/magazine/ClientMagazineDetailPage'))
const TrendPage = lazy(() => import('../../pages/client/trend/TrendPage'))
const TexturePage = lazy(() => import('../../pages/client/trend/TexturePage'))
const TextureListPage = lazy(() => import('../../pages/client/trend/TextureListPage'))
const SyrupBestListPage = lazy(() => import('../../pages/client/trend/SyrupBestListPage'))
const TextureGalleryListPage = lazy(() => import('../../pages/client/trend/TextureGalleryListPage'))
const PartsPage = lazy(() => import('../../pages/client/trend/PartsPage'))
const PartsListPage = lazy(() => import('../../pages/client/trend/PartsListPage'))
const StoneBestListPage = lazy(() => import('../../pages/client/trend/StoneBestListPage'))
const MarbleBestListPage = lazy(() => import('../../pages/client/trend/MarbleBestListPage'))
const PopularArtListPage = lazy(() => import('../../pages/client/trend/PopularArtListPage'))
const ChicBestListPage = lazy(() => import('../../pages/client/trend/ChicBestListPage'))
const FullPartsListPage = lazy(() => import('../../pages/client/trend/FullPartsListPage'))
const PopularDesignPage = lazy(() => import('../../pages/client/trend/PopularDesignPage'))
const PeriodBestListPage = lazy(() => import('../../pages/client/trend/PeriodBestListPage'))
const ReactionBestListPage = lazy(() => import('../../pages/client/trend/ReactionBestListPage'))
const ShapeBestListPage = lazy(() => import('../../pages/client/trend/ShapeBestListPage'))
const SearchTrendListPage = lazy(() => import('../../pages/client/trend/SearchTrendListPage'))
const PatternPage = lazy(() => import('../../pages/client/trend/PatternPage'))
const PatternListPage = lazy(() => import('../../pages/client/trend/PatternListPage'))
const PatternCurationPage = lazy(() => import('../../pages/client/PatternCurationPage'))
const MoodPage = lazy(() => import('../../pages/client/trend/MoodPage'))
const MoodListPage = lazy(() => import('../../pages/client/trend/MoodListPage'))
const PopularMoodListPage = lazy(() => import('../../pages/client/trend/PopularMoodListPage'))
const CategoryPage = lazy(() => import('../../pages/client/CategoryPage'))
const SearchMainPage = lazy(() => import('../../pages/client/SearchMainPage'))
const ClientLoginPage = lazy(() => import('../../pages/client/ClientLoginPage'))
const ClientUpdatePasswordPage = lazy(() => import('../../pages/client/auth/ClientUpdatePasswordPage'))
const ClientAccountSettingsPage = lazy(() => import('../../pages/client/ClientAccountSettingsPage'))
const ClientNotificationSettingsPage = lazy(() => import('../../pages/client/ClientNotificationSettingsPage'))
const ClientNotificationPage = lazy(() => import('../../pages/client/ClientNotificationPage'))
const ClientNoticePage = lazy(() => import('../../pages/client/ClientNoticePage'))
const ClientSupportPage = lazy(() => import('../../pages/client/ClientSupportPage'))
const ClientFaqPage = lazy(() => import('../../pages/client/ClientFaqPage'))
const ClientTermsPage = lazy(() => import('../../pages/client/ClientTermsPage'))
const ClientPrivacyPage = lazy(() => import('../../pages/client/ClientPrivacyPage'))
const ClientMyPage = lazy(() => import('../../pages/client/ClientMyPage'))
const ClientMyNailListPage = lazy(() => import('../../pages/client/ClientMyNailListPage'))
const ClientHomePage = lazy(() => import('../../pages/client/ClientHomePage'))
const ClientRecommendPage = lazy(() => import('../../pages/client/ClientRecommendPage'))
const ClientPage = lazy(() => import('../../pages/client/ClientPage'))
const ClientSituationListPage = lazy(() => import('../../pages/client/ClientSituationListPage'))
const ClientStyleBestListPage = lazy(() => import('../../pages/client/ClientStyleBestListPage'))
const ClientStyleCurationPage = lazy(() => import('../../pages/client/ClientStyleCurationPage'))
const ClientStyleGalleryListPage = lazy(() => import('../../pages/client/ClientStyleGalleryListPage'))
const ClientStyleListPage = lazy(() => import('../../pages/client/ClientStyleListPage'))
const ClientThemeListPage = lazy(() => import('../../pages/client/ClientThemeListPage'))
const ClientSeasonCurationPage = lazy(() => import('../../pages/client/ClientSeasonCurationPage'))
const ClientSeasonListPage = lazy(() => import('../../pages/client/ClientSeasonListPage'))
const ClientVacationListPage = lazy(() => import('../../pages/client/ClientVacationListPage'))
const ClientSeasonPopularListPage = lazy(() => import('../../pages/client/ClientSeasonPopularListPage'))
const ClientColorCurationPage = lazy(() => import('../../pages/client/ClientColorCurationPage'))
const ClientColorListPage = lazy(() => import('../../pages/client/ClientColorListPage'))
const ClientColorThemeListPage = lazy(() => import('../../pages/client/ClientColorThemeListPage'))
const ClientColorPopularListPage = lazy(() => import('../../pages/client/ClientColorPopularListPage'))
const ClientTodaySpecialPage = lazy(() => import('../../pages/client/ClientTodaySpecialPage'))
const TestIntroPage = lazy(() => import('../../pages/client/test/TestIntroPage'))
const TestStep1Page = lazy(() => import('../../pages/client/test/TestStep1Page'))
const TestStep2Page = lazy(() => import('../../pages/client/test/TestStep2Page'))
const TestStep3Page = lazy(() => import('../../pages/client/test/TestStep3Page'))
const TestResultPage = lazy(() => import('../../pages/client/test/TestResultPage'))
const NotFoundPage = lazy(() => import('../../pages/client/NotFoundPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <ClientLayout />,
    children: [
      { index: true, element: <ClientHomePage /> },
      { path: 'category', element: <CategoryPage /> },
      { path: 'recommend', element: <ClientRecommendPage /> },
      { path: 'color-curation', element: <ClientColorCurationPage /> },
      { path: 'color-list', element: <ClientColorListPage /> },
      { path: 'color-theme-list', element: <ClientColorThemeListPage /> },
      { path: 'color-popular-list', element: <ClientColorPopularListPage /> },
      { path: 'today-special', element: <ClientTodaySpecialPage /> },
      { path: 'theme', element: <ClientPage /> },
      { path: 'style-curation', element: <ClientStyleCurationPage /> },
      { path: 'style-list', element: <ClientStyleListPage /> },
      { path: 'style-best-list', element: <ClientStyleBestListPage /> },
      { path: 'style-gallery-list', element: <ClientStyleGalleryListPage /> },
      { path: 'theme-list', element: <ClientThemeListPage /> },
      { path: 'situation-list', element: <ClientSituationListPage /> },
      { path: 'season-curation', element: <ClientSeasonCurationPage /> },
      { path: 'season-list', element: <ClientSeasonListPage /> },
      { path: 'vacation-list', element: <ClientVacationListPage /> },
      {
        path: 'season-popular-list',
        element: <ClientSeasonPopularListPage />,
      },
      { path: 'detail/:id', element: <ClientNailDetailPage /> },
      { path: 'gallery', element: <ClientGalleryPage /> },
      { path: 'magazine', element: <ClientMagazinePage /> },
      { path: 'magazine/:id', element: <ClientMagazineDetailPage /> },
      { path: 'search', element: <SearchMainPage /> },
      { path: 'login', element: <ClientLoginPage /> },
      { path: 'update-password', element: <ClientUpdatePasswordPage /> },
      { path: 'notifications', element: <ClientNotificationSettingsPage /> },
      { path: 'notification-list', element: <ClientNotificationPage /> },
      { path: 'support', element: <ClientSupportPage /> },
      { path: 'faq', element: <ClientFaqPage /> },
      { path: 'terms', element: <ClientTermsPage /> },
      { path: 'privacy', element: <ClientPrivacyPage /> },
      { path: 'notice', element: <ClientNoticePage /> },
      { path: 'account', element: <ClientAccountSettingsPage /> },
      { path: 'my', element: <ClientMyPage /> },
      { path: 'my/list/:type', element: <ClientMyNailListPage /> },
      { path: 'ranking', element: <ClientRankingPage /> },
      { path: 'popular-design', element: <PopularDesignPage /> },
      { path: 'period-best-list', element: <PeriodBestListPage /> },
      { path: 'reaction-best-list', element: <ReactionBestListPage /> },
      { path: 'shape-best-list', element: <ShapeBestListPage /> },
      {
        path: 'search-trend-list',
        element: <SearchTrendListPage />,
      },
      { path: 'trend', element: <TrendPage /> },
      { path: 'texture', element: <TexturePage /> },
      {
        path: 'texture-list',
        element: <TextureListPage />,
      },
      { path: 'syrup-best', element: <SyrupBestListPage /> },
      { path: 'texture-gallery', element: <TextureGalleryListPage /> },
      { path: 'parts', element: <PartsPage /> },
      { path: 'parts-list', element: <PartsListPage /> },
      { path: 'stone-best-list', element: <StoneBestListPage /> },
      { path: 'marble-best-list', element: <MarbleBestListPage /> },
      { path: 'popular-art-list', element: <PopularArtListPage /> },
      { path: 'chic-best-list', element: <ChicBestListPage /> },
      { path: 'full-parts-list', element: <FullPartsListPage /> },
      { path: 'art', element: <PatternCurationPage /> },
      { path: 'pattern', element: <PatternPage /> },
      { path: 'pattern-list', element: <PatternListPage /> },
      { path: 'mood', element: <MoodPage /> },
      { path: 'mood-list', element: <MoodListPage /> },
      { path: 'popular-mood-list', element: <PopularMoodListPage /> },
      { path: 'test-intro', element: <TestIntroPage /> },
      { path: 'test-step1', element: <TestStep1Page /> },
      { path: 'test-step2', element: <TestStep2Page /> },
      { path: 'test-step3', element: <TestStep3Page /> },
      { path: 'test-result', element: <TestResultPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="upload" replace /> },
          { path: 'upload', element: <AdminUploadPage /> },
          { path: 'board', element: <AdminBoard /> },
          { path: 'manage', element: <AdminManagePage /> },
        ],
      },
    ],
  },
  { path: '/client/*', element: <Navigate to="/" replace /> },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-gray-400">화면을 불러오는 중입니다...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
