#!/usr/bin/env python3
"""
Mi Galleria Backend API Tests
Testing the rooster breeding app backend endpoints

Test Scenarios:
1. PUT /api/auth/change-pin endpoint:
   - Register new user with phone "9999999999" and PIN "1234"
   - Login to get a valid token
   - Change PIN from "1234" to "5678" using the token
   - Verify the PIN change by logging in again with new PIN
   - Test error cases: incorrect current PIN, invalid new PIN format

2. GET /api/export/data endpoint:
   - Use authenticated user
   - Call GET /api/export/data
   - Verify it returns counts for: aves, cruces, camadas, peleas
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://mi-galleria-final.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test data
TEST_PHONE = "9999999999"
TEST_PIN = "1234"
NEW_PIN = "5678"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    color = Colors.BLUE if level == "INFO" else Colors.GREEN if level == "SUCCESS" else Colors.RED if level == "ERROR" else Colors.YELLOW
    print(f"[{timestamp}] {color}{level}: {message}{Colors.END}")

def test_user_registration():
    """Test user registration with phone 9999999999 and PIN 1234"""
    log("Testing user registration...")
    
    payload = {
        "telefono": TEST_PHONE,
        "pin": TEST_PIN,
        "nombre": "Test Usuario Galleria",
        "email": "test@migalleria.com"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            log(f"✅ User registration successful - User ID: {data['user']['id']}", "SUCCESS")
            return data['access_token'], data['user']['id']
        elif response.status_code == 400 and "ya está registrado" in response.text:
            log("⚠️ User already exists, proceeding to login", "WARN")
            return test_user_login()
        else:
            log(f"❌ Registration failed: {response.status_code} - {response.text}", "ERROR")
            return None, None
            
    except Exception as e:
        log(f"❌ Registration request failed: {str(e)}", "ERROR")
        return None, None

def test_user_login(pin=TEST_PIN):
    """Test user login with given PIN"""
    log(f"Testing user login with PIN: {pin}...")
    
    payload = {
        "telefono": TEST_PHONE,
        "pin": pin
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            log(f"✅ Login successful - Token: {data['access_token'][:20]}...", "SUCCESS")
            return data['access_token'], data['user']['id']
        else:
            log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
            return None, None
            
    except Exception as e:
        log(f"❌ Login request failed: {str(e)}", "ERROR")
        return None, None

def test_change_pin(token, current_pin=TEST_PIN, new_pin=NEW_PIN):
    """Test PIN change endpoint"""
    log(f"Testing PIN change from {current_pin} to {new_pin}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "current_pin": current_pin,
        "new_pin": new_pin
    }
    
    try:
        response = requests.put(f"{API_BASE}/auth/change-pin", json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            log("✅ PIN change successful", "SUCCESS")
            return True
        else:
            log(f"❌ PIN change failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ PIN change request failed: {str(e)}", "ERROR")
        return False

def test_change_pin_error_cases(token):
    """Test PIN change error cases"""
    log("Testing PIN change error cases...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Incorrect current PIN
    log("Test case: Incorrect current PIN")
    payload = {"current_pin": "9999", "new_pin": "1111"}
    try:
        response = requests.put(f"{API_BASE}/auth/change-pin", json=payload, headers=headers, timeout=10)
        if response.status_code == 400 and "PIN actual incorrecto" in response.text:
            log("✅ Correctly rejected incorrect current PIN", "SUCCESS")
        else:
            log(f"❌ Expected 400 error for incorrect PIN, got: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"❌ Error testing incorrect PIN: {str(e)}", "ERROR")
    
    # Test 2: Invalid new PIN format (too short)
    log("Test case: Invalid new PIN format (too short)")
    payload = {"current_pin": NEW_PIN, "new_pin": "12"}
    try:
        response = requests.put(f"{API_BASE}/auth/change-pin", json=payload, headers=headers, timeout=10)
        if response.status_code == 400 and "4 a 6 dígitos" in response.text:
            log("✅ Correctly rejected short PIN", "SUCCESS")
        else:
            log(f"❌ Expected 400 error for short PIN, got: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"❌ Error testing short PIN: {str(e)}", "ERROR")
    
    # Test 3: Invalid new PIN format (too long)
    log("Test case: Invalid new PIN format (too long)")
    payload = {"current_pin": NEW_PIN, "new_pin": "1234567"}
    try:
        response = requests.put(f"{API_BASE}/auth/change-pin", json=payload, headers=headers, timeout=10)
        if response.status_code == 400 and "4 a 6 dígitos" in response.text:
            log("✅ Correctly rejected long PIN", "SUCCESS")
        else:
            log(f"❌ Expected 400 error for long PIN, got: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"❌ Error testing long PIN: {str(e)}", "ERROR")

    # Test 4: Non-numeric PIN
    log("Test case: Non-numeric new PIN")
    payload = {"current_pin": NEW_PIN, "new_pin": "abcd"}
    try:
        response = requests.put(f"{API_BASE}/auth/change-pin", json=payload, headers=headers, timeout=10)
        if response.status_code == 400:
            log("✅ Correctly rejected non-numeric PIN", "SUCCESS")
        else:
            log(f"❌ Expected 400 error for non-numeric PIN, got: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"❌ Error testing non-numeric PIN: {str(e)}", "ERROR")

def test_export_data(token):
    """Test export data endpoint"""
    log("Testing export data endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/export/data", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            log(f"✅ Export data endpoint successful", "SUCCESS")
            
            # Verify expected fields are present
            expected_fields = ["aves", "cruces", "camadas", "peleas"]
            missing_fields = []
            
            for field in expected_fields:
                if field not in data:
                    missing_fields.append(field)
                else:
                    log(f"  - {field}: {data[field]}", "INFO")
            
            if missing_fields:
                log(f"❌ Missing fields in export data: {missing_fields}", "ERROR")
                return False
            else:
                log("✅ All expected fields present in export data", "SUCCESS")
                return True
                
        else:
            log(f"❌ Export data failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Export data request failed: {str(e)}", "ERROR")
        return False

def test_export_data_without_auth():
    """Test export data endpoint without authentication (should fail)"""
    log("Testing export data endpoint without authentication...")
    
    try:
        response = requests.get(f"{API_BASE}/export/data", timeout=10)
        
        if response.status_code == 401:
            log("✅ Correctly rejected unauthenticated request", "SUCCESS")
            return True
        else:
            log(f"❌ Expected 401 error, got: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Export data request failed: {str(e)}", "ERROR")
        return False

def main():
    """Main test execution"""
    log("=== MI GALLERIA BACKEND API TESTS ===", "INFO")
    log(f"Testing backend at: {BACKEND_URL}", "INFO")
    log("", "INFO")
    
    # Test results tracking
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    def track_result(success, test_name):
        results["total"] += 1
        if success:
            results["passed"] += 1
            log(f"✅ {test_name} - PASSED", "SUCCESS")
        else:
            results["failed"] += 1
            log(f"❌ {test_name} - FAILED", "ERROR")
    
    # Step 1: Register user
    token, user_id = test_user_registration()
    track_result(token is not None, "User Registration")
    
    if not token:
        log("❌ Cannot proceed without valid token", "ERROR")
        return
    
    # Step 2: Test export data endpoint (before changes)
    export_success = test_export_data(token)
    track_result(export_success, "Export Data - Authenticated")
    
    # Step 3: Test export data without auth
    unauth_success = test_export_data_without_auth()
    track_result(unauth_success, "Export Data - Unauthenticated (should fail)")
    
    # Step 4: Change PIN
    pin_change_success = test_change_pin(token)
    track_result(pin_change_success, "PIN Change")
    
    if pin_change_success:
        # Step 5: Verify PIN change by logging in with new PIN
        new_token, _ = test_user_login(NEW_PIN)
        track_result(new_token is not None, "Login with New PIN")
        
        if new_token:
            # Step 6: Test error cases with new token
            test_change_pin_error_cases(new_token)
            
            # Step 7: Test export data with new token
            export_success_2 = test_export_data(new_token)
            track_result(export_success_2, "Export Data - After PIN Change")
    
    # Final Results
    log("", "INFO")
    log("=== TEST RESULTS SUMMARY ===", "INFO")
    log(f"Total Tests: {results['total']}", "INFO")
    log(f"Passed: {results['passed']}", "SUCCESS" if results['passed'] > 0 else "INFO")
    log(f"Failed: {results['failed']}", "ERROR" if results['failed'] > 0 else "INFO")
    
    if results['failed'] == 0:
        log("🎉 ALL TESTS PASSED!", "SUCCESS")
        sys.exit(0)
    else:
        log(f"⚠️ {results['failed']} TEST(S) FAILED", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()