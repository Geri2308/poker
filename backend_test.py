#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Poker Ranking Application
Tests all endpoints and functionality as specified in the review request.
"""

import requests
import json
import sys
from typing import Dict, List, Any

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BASE_URL}/api"
print(f"Testing API at: {API_URL}")

class PokerRankingAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response': response_data
        })
    
    def test_health_check(self):
        """Test GET /api/ - Health check endpoint"""
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Poker Ranking API" in data["message"]:
                    self.log_test("Health Check", True, f"API is running: {data['message']}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
        return False
    
    def test_get_all_persons_initial(self):
        """Test GET /api/persons - Should return at least 10 default persons"""
        try:
            response = self.session.get(f"{API_URL}/persons")
            if response.status_code == 200:
                persons = response.json()
                
                # Check if we have at least 10 persons
                if len(persons) < 10:
                    self.log_test("Get All Persons (Initial)", False, f"Expected at least 10 persons, got {len(persons)}")
                    return False
                
                # Check expected names are present
                expected_names = ["Geri", "Sepp", "Toni", "Geri Ranner", "Manuel", "Rene", "Gabi", "Roland", "Stefan", "Richi"]
                actual_names = [p["name"] for p in persons]
                
                missing_names = set(expected_names) - set(actual_names)
                if missing_names:
                    self.log_test("Get All Persons (Initial)", False, f"Missing names: {missing_names}")
                    return False
                
                # Check that default persons (IDs 1-10) have amount 0.0
                default_persons = [p for p in persons if p["id"] in [str(i) for i in range(1, 11)]]
                non_zero_amounts = [p for p in default_persons if p["amount"] != 0.0]
                if non_zero_amounts:
                    self.log_test("Get All Persons (Initial)", False, f"Found non-zero amounts in default persons: {non_zero_amounts}")
                    return False
                
                self.log_test("Get All Persons (Initial)", True, f"Found {len(persons)} persons including all 10 default persons with correct data")
                return persons
            else:
                self.log_test("Get All Persons (Initial)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get All Persons (Initial)", False, f"Exception: {str(e)}")
        return False
    
    def test_get_person_by_id(self, person_id: str = "1"):
        """Test GET /api/persons/{id} - Get specific person"""
        try:
            response = self.session.get(f"{API_URL}/persons/{person_id}")
            if response.status_code == 200:
                person = response.json()
                
                # Validate person structure
                required_fields = ["id", "name", "amount", "created_at", "updated_at"]
                missing_fields = [field for field in required_fields if field not in person]
                if missing_fields:
                    self.log_test("Get Person By ID", False, f"Missing fields: {missing_fields}")
                    return False
                
                if person["id"] != person_id:
                    self.log_test("Get Person By ID", False, f"ID mismatch: expected {person_id}, got {person['id']}")
                    return False
                
                self.log_test("Get Person By ID", True, f"Retrieved person: {person['name']} (ID: {person['id']})")
                return person
            else:
                self.log_test("Get Person By ID", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Person By ID", False, f"Exception: {str(e)}")
        return False
    
    def test_get_person_invalid_id(self):
        """Test GET /api/persons/{id} with invalid ID - Should return 404"""
        try:
            response = self.session.get(f"{API_URL}/persons/invalid_id_999")
            if response.status_code == 404:
                self.log_test("Get Person Invalid ID", True, "Correctly returned 404 for invalid ID")
                return True
            else:
                self.log_test("Get Person Invalid ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Get Person Invalid ID", False, f"Exception: {str(e)}")
        return False
    
    def test_update_person_amount(self, person_id: str = "1", new_amount: float = 150.75):
        """Test PUT /api/persons/{id} - Update person's amount"""
        try:
            update_data = {"amount": new_amount}
            response = self.session.put(f"{API_URL}/persons/{person_id}", json=update_data)
            
            if response.status_code == 200:
                person = response.json()
                
                if person["amount"] != new_amount:
                    self.log_test("Update Person Amount", False, f"Amount not updated: expected {new_amount}, got {person['amount']}")
                    return False
                
                if person["id"] != person_id:
                    self.log_test("Update Person Amount", False, f"Wrong person returned: expected ID {person_id}, got {person['id']}")
                    return False
                
                self.log_test("Update Person Amount", True, f"Updated {person['name']} amount to {person['amount']}")
                return person
            else:
                self.log_test("Update Person Amount", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Update Person Amount", False, f"Exception: {str(e)}")
        return False
    
    def test_update_person_invalid_id(self):
        """Test PUT /api/persons/{id} with invalid ID - Should return 404"""
        try:
            update_data = {"amount": 100.0}
            response = self.session.put(f"{API_URL}/persons/invalid_id_999", json=update_data)
            
            if response.status_code == 404:
                self.log_test("Update Person Invalid ID", True, "Correctly returned 404 for invalid ID")
                return True
            else:
                self.log_test("Update Person Invalid ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Update Person Invalid ID", False, f"Exception: {str(e)}")
        return False
    
    def test_bulk_update_persons(self):
        """Test PUT /api/persons/bulk - Bulk update multiple persons"""
        try:
            # Update multiple persons with different amounts
            bulk_data = {
                "persons": [
                    {"id": "2", "amount": 200.50},
                    {"id": "3", "amount": 175.25},
                    {"id": "4", "amount": 300.00}
                ]
            }
            
            response = self.session.put(f"{API_URL}/persons/bulk", json=bulk_data)
            
            if response.status_code == 200:
                persons = response.json()
                
                # Check that we got persons back (at least 10)
                if len(persons) < 10:
                    self.log_test("Bulk Update Persons", False, f"Expected at least 10 persons, got {len(persons)}")
                    return False
                
                # Check that the updated persons have correct amounts
                updated_persons = {p["id"]: p["amount"] for p in persons}
                
                for update in bulk_data["persons"]:
                    if updated_persons.get(update["id"]) != update["amount"]:
                        self.log_test("Bulk Update Persons", False, f"Person {update['id']} amount not updated correctly")
                        return False
                
                self.log_test("Bulk Update Persons", True, f"Successfully bulk updated {len(bulk_data['persons'])} persons")
                return persons
            else:
                self.log_test("Bulk Update Persons", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Bulk Update Persons", False, f"Exception: {str(e)}")
        return False
    
    def test_sorting_by_amount(self):
        """Test that persons are returned sorted by amount (highest first)"""
        try:
            response = self.session.get(f"{API_URL}/persons")
            if response.status_code == 200:
                persons = response.json()
                
                # Check if sorted by amount (highest first)
                amounts = [p["amount"] for p in persons]
                sorted_amounts = sorted(amounts, reverse=True)
                
                if amounts != sorted_amounts:
                    self.log_test("Sorting By Amount", False, f"Not sorted correctly. Got: {amounts}, Expected: {sorted_amounts}")
                    return False
                
                self.log_test("Sorting By Amount", True, f"Persons correctly sorted by amount: {amounts}")
                return True
            else:
                self.log_test("Sorting By Amount", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Sorting By Amount", False, f"Exception: {str(e)}")
        return False
    
    def test_create_person(self):
        """Test POST /api/persons - Create new person"""
        try:
            new_person_data = {
                "name": "Test Player",
                "amount": 50.0
            }
            
            response = self.session.post(f"{API_URL}/persons", json=new_person_data)
            
            if response.status_code == 200:
                person = response.json()
                
                if person["name"] != new_person_data["name"]:
                    self.log_test("Create Person", False, f"Name mismatch: expected {new_person_data['name']}, got {person['name']}")
                    return False
                
                if person["amount"] != new_person_data["amount"]:
                    self.log_test("Create Person", False, f"Amount mismatch: expected {new_person_data['amount']}, got {person['amount']}")
                    return False
                
                # Check required fields exist
                required_fields = ["id", "name", "amount", "created_at", "updated_at"]
                missing_fields = [field for field in required_fields if field not in person]
                if missing_fields:
                    self.log_test("Create Person", False, f"Missing fields: {missing_fields}")
                    return False
                
                self.log_test("Create Person", True, f"Created person: {person['name']} with ID {person['id']}")
                return person
            else:
                self.log_test("Create Person", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Create Person", False, f"Exception: {str(e)}")
        return False
    
    def test_reset_all_amounts(self):
        """Test POST /api/persons/reset - Reset all amounts to 0"""
        try:
            response = self.session.post(f"{API_URL}/persons/reset")
            
            if response.status_code == 200:
                persons = response.json()
                
                # Check all amounts are 0.0
                non_zero_amounts = [p for p in persons if p["amount"] != 0.0]
                if non_zero_amounts:
                    self.log_test("Reset All Amounts", False, f"Found non-zero amounts after reset: {non_zero_amounts}")
                    return False
                
                self.log_test("Reset All Amounts", True, f"Successfully reset all {len(persons)} persons to amount 0.0")
                return persons
            else:
                self.log_test("Reset All Amounts", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Reset All Amounts", False, f"Exception: {str(e)}")
        return False
    
    def test_data_persistence(self):
        """Test that data persists between operations"""
        try:
            # Update a person's amount
            update_response = self.session.put(f"{API_URL}/persons/5", json={"amount": 123.45})
            if update_response.status_code != 200:
                self.log_test("Data Persistence", False, "Failed to update person for persistence test")
                return False
            
            # Get the person again to verify persistence
            get_response = self.session.get(f"{API_URL}/persons/5")
            if get_response.status_code != 200:
                self.log_test("Data Persistence", False, "Failed to retrieve person for persistence test")
                return False
            
            person = get_response.json()
            if person["amount"] != 123.45:
                self.log_test("Data Persistence", False, f"Amount not persisted: expected 123.45, got {person['amount']}")
                return False
            
            self.log_test("Data Persistence", True, "Data correctly persisted between operations")
            return True
        except Exception as e:
            self.log_test("Data Persistence", False, f"Exception: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("=" * 60)
        print("POKER RANKING API - COMPREHENSIVE TEST SUITE")
        print("=" * 60)
        print()
        
        # Test 1: Health Check
        self.test_health_check()
        
        # Test 2: Get all persons (initial state)
        initial_persons = self.test_get_all_persons_initial()
        
        # Test 3: Get person by ID
        self.test_get_person_by_id("1")
        
        # Test 4: Get person with invalid ID
        self.test_get_person_invalid_id()
        
        # Test 5: Update person amount
        self.test_update_person_amount("1", 150.75)
        
        # Test 6: Update person with invalid ID
        self.test_update_person_invalid_id()
        
        # Test 7: Bulk update persons
        self.test_bulk_update_persons()
        
        # Test 8: Check sorting by amount
        self.test_sorting_by_amount()
        
        # Test 9: Create new person
        self.test_create_person()
        
        # Test 10: Data persistence
        self.test_data_persistence()
        
        # Test 11: Reset all amounts
        self.test_reset_all_amounts()
        
        # Test 12: Verify reset worked by checking sorting
        final_persons_response = self.session.get(f"{API_URL}/persons")
        if final_persons_response.status_code == 200:
            final_persons = final_persons_response.json()
            all_zero = all(p["amount"] == 0.0 for p in final_persons)
            self.log_test("Final State Verification", all_zero, 
                         "All amounts are 0.0 after reset" if all_zero else "Some amounts are not 0.0 after reset")
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! The Poker Ranking API is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Please check the issues above.")
            
        return passed == total

if __name__ == "__main__":
    tester = PokerRankingAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)