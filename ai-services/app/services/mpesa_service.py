import requests
from datetime import datetime
import base64
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class MpesaService:
    def __init__(self):
        # SANDBOX CREDENTIALS (In production, load from env vars)
        self.consumer_key: str = "sb_consumer_key" 
        self.consumer_secret: str = "sb_consumer_secret"
        self.passkey: str = "sb_passkey"
        self.shortcode: str = "174379" # Default Sandbox Shortcode
        self.base_url: str = "https://sandbox.safaricom.co.ke"

    def _get_access_token(self) -> str:
        """Authenticate with Daraja API."""
        api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        try:
            r = requests.get(api_url, auth=(self.consumer_key, self.consumer_secret))
            r.raise_for_status()
            return r.json()['access_token']
        except Exception as e:
            logger.error(f"Failed to get M-Pesa token: {e}")
            raise

    def _generate_password(self, timestamp: str) -> str:
        data_to_encode = self.shortcode + self.passkey + timestamp
        return base64.b64encode(data_to_encode.encode()).decode('utf-8')

    def initiate_stk_push(self, phone_number: str, amount: int, reference: str) -> Dict[str, Any]:
        """Trigger an STK Push to the student's phone."""
        access_token = self._get_access_token()
        api_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = self._generate_password(timestamp)
        
        headers = { "Authorization": f"Bearer {access_token}" }
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": "https://mydomain.com/api/payments/callback", # Replace with real hook
            "AccountReference": reference,
            "TransactionDesc": "Stipend Payment" 
        }
        
        try:
            r = requests.post(api_url, json=payload, headers=headers)
            r.raise_for_status()
            return r.json()
        except Exception as e:
             logger.error(f"STK Push Failed: {e}")
             return {"error": str(e)}

    def process_callback(self, data: Dict[str, Any]):
        """Handle M-Pesa Callback."""
        # Process the result code
        # 0 = Success, others = Fail
        try:
            body = data.get('Body', {}).get('stkCallback', {})
            result_code = body.get('ResultCode')
            if result_code == 0:
                logger.info("Payment Successful")
                # Trigger EventBus: PAYMENT_RECEIVED
            else:
                logger.warning(f"Payment Failed: {body.get('ResultDesc')}")
        except Exception as e:
            logger.error(f"Error processing callback: {e}")
