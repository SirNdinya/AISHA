import unittest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

# Import all services
from app.services.chatbot_service import ChatbotService
from app.services.chat_service import ChatContextService
from app.services.batch_service import BatchService
from app.services.knowledge_service import KnowledgeService
from app.services.blockchain_service import BlockchainService
from app.services.scraper_service import AutonomousScraperService
from app.services.company_ranking_service import CompanyRankingService
from app.services.document_service import DocumentService
from app.services.matching_service import MatchingService
from app.services.learning_service import LearningService
from app.services.mpesa_service import MpesaService
from app.services.ollama_service import OllamaService
from app.services.opportunity_discovery_service import OpportunityDiscoveryService
from app.services.reviewer_agent import ReviewerAgent
from app.services.scheduler_service import SchedulerService
from app.services.sync_service import SyncService
from app.services.transcript_service import TranscriptService
from app.services.workflow_service import WorkflowService
from app.services.student_agent import StudentAutonomyAgent
from app.services.chief_agent import ChiefAutonomyAgent

class TestServicesInit(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)

    def test_chatbot_service_init(self):
        service = ChatbotService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_chat_service_init(self):
        service = ChatContextService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_batch_service_init(self):
        service = BatchService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_knowledge_service_init(self):
        service = KnowledgeService()
        self.assertIsNotNone(service.model)

    def test_blockchain_service_init(self):
        service = BlockchainService()
        self.assertIsNotNone(service.chain)

    def test_scraper_service_init(self):
        service = AutonomousScraperService()
        self.assertIsNotNone(service.platforms)

    def test_company_ranking_service_init(self):
        service = CompanyRankingService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_document_service_init(self):
        service = DocumentService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_matching_service_init(self):
        service = MatchingService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_learning_service_init(self):
        service = LearningService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_mpesa_service_init(self):
        service = MpesaService()
        self.assertIsNotNone(service.base_url)

    def test_ollama_service_init(self):
        service = OllamaService()
        self.assertIsNotNone(service.client)

    def test_opportunity_discovery_service_init(self):
        service = OpportunityDiscoveryService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_reviewer_agent_init(self):
        service = ReviewerAgent(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_scheduler_service_init(self):
        service = SchedulerService()
        self.assertIsNotNone(service.scheduler)

    def test_sync_service_init(self):
        service = SyncService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_workflow_service_init(self):
        service = WorkflowService(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_student_agent_init(self):
        service = StudentAutonomyAgent(self.mock_db)
        self.assertIsNotNone(service.db)

    def test_chief_agent_init(self):
        service = ChiefAutonomyAgent(self.mock_db)
        self.assertIsNotNone(service.db)

if __name__ == '__main__':
    unittest.main()
