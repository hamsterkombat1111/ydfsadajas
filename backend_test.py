import requests
import sys
import json
from datetime import datetime
import uuid

class PrankVZAPITester:
    def __init__(self, base_url="https://prank-central-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_admin_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                    return True, response_data
                except:
                    print(f"   Response: {response.text}")
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_log_visit(self):
        """Test visit logging"""
        visit_data = {
            "user_agent": "PrankVZ-Test-Bot/1.0"
        }
        return self.run_test("Log Visit", "POST", "api/log-visit", 200, visit_data)

    def test_get_admins(self):
        """Test getting admin list"""
        return self.run_test("Get Admins", "GET", "api/admins", 200)

    def test_create_admin(self):
        """Test creating a new admin"""
        test_admin = {
            "name": f"Test Admin {datetime.now().strftime('%H%M%S')}",
            "telegram_id": f"test_{uuid.uuid4().hex[:8]}"
        }
        success, response = self.run_test("Create Admin", "POST", "api/admins", 200, test_admin)
        if success and 'id' in response:
            self.created_admin_id = response['id']
            print(f"   Created admin ID: {self.created_admin_id}")
        return success, response

    def test_create_duplicate_admin(self):
        """Test creating duplicate admin (should fail)"""
        duplicate_admin = {
            "name": "Duplicate Test",
            "telegram_id": "123456789"  # This should already exist from startup
        }
        return self.run_test("Create Duplicate Admin", "POST", "api/admins", 400, duplicate_admin)

    def test_delete_admin(self):
        """Test deleting an admin"""
        if not self.created_admin_id:
            print("❌ No admin ID to delete")
            return False, {}
        
        return self.run_test("Delete Admin", "DELETE", f"api/admins/{self.created_admin_id}", 200)

    def test_delete_nonexistent_admin(self):
        """Test deleting non-existent admin"""
        fake_id = 99999  # Use a high integer ID that doesn't exist
        return self.run_test("Delete Non-existent Admin", "DELETE", f"api/admins/{fake_id}", 404)

    def test_get_visits(self):
        """Test getting visit logs"""
        return self.run_test("Get Visits", "GET", "api/visits", 200)

    def test_block_ip(self):
        """Test blocking an IP address"""
        block_data = {
            "ip": "192.168.1.100"
        }
        return self.run_test("Block IP", "POST", "api/block-ip", 200, block_data)

    def test_block_duplicate_ip(self):
        """Test blocking already blocked IP"""
        block_data = {
            "ip": "192.168.1.100"  # Same IP as above
        }
        return self.run_test("Block Duplicate IP", "POST", "api/block-ip", 400, block_data)

    def test_get_blocked_ips(self):
        """Test getting blocked IPs"""
        return self.run_test("Get Blocked IPs", "GET", "api/blocked-ips", 200)

    def test_unblock_ip(self):
        """Test unblocking an IP address"""
        unblock_data = {
            "ip": "192.168.1.100"
        }
        return self.run_test("Unblock IP", "POST", "api/unblock-ip", 200, unblock_data)

    def test_unblock_nonexistent_ip(self):
        """Test unblocking non-existent IP"""
        unblock_data = {
            "ip": "192.168.1.999"
        }
        return self.run_test("Unblock Non-existent IP", "POST", "api/unblock-ip", 404, unblock_data)

def main():
    print("🚀 Starting PrankVZ API Tests")
    print("=" * 50)
    
    tester = PrankVZAPITester()
    
    # Run all tests in logical order
    test_methods = [
        tester.test_health_check,
        tester.test_log_visit,
        tester.test_get_admins,
        tester.test_create_admin,
        tester.test_create_duplicate_admin,
        tester.test_get_visits,
        tester.test_block_ip,
        tester.test_block_duplicate_ip,
        tester.test_get_blocked_ips,
        tester.test_unblock_ip,
        tester.test_unblock_nonexistent_ip,
        tester.test_delete_admin,
        tester.test_delete_nonexistent_admin,
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test {test_method.__name__} failed with exception: {e}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())