// API service functions for backend integration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

export const personService = {
  // Load all persons from backend
  async loadPersons() {
    try {
      const response = await fetch(`${API_URL}/persons`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const persons = await response.json();
      return persons;
    } catch (error) {
      console.error('Error loading persons:', error);
      // Fallback to localStorage if backend fails
      return loadMockData();
    }
  },

  // Save all persons to backend
  async savePersons(persons) {
    try {
      const response = await fetch(`${API_URL}/persons/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persons: persons.map(p => ({ id: p.id, amount: p.amount }))
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedPersons = await response.json();
      return updatedPersons;
    } catch (error) {
      console.error('Error saving persons:', error);
      // Fallback to localStorage if backend fails
      saveMockData(persons);
      return persons;
    }
  },

  // Reset all amounts to 0
  async resetAllAmounts() {
    try {
      const response = await fetch(`${API_URL}/persons/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const resetPersons = await response.json();
      return resetPersons;
    } catch (error) {
      console.error('Error resetting amounts:', error);
      // Fallback to localStorage if backend fails
      const mockPersons = loadMockData();
      const resetPersons = mockPersons.map(person => ({ ...person, amount: 0 }));
      saveMockData(resetPersons);
      return resetPersons;
    }
  }
};

// Legacy mock functions for fallback
export const mockPersons = [
  { id: "1", name: "Geri", amount: 0 },
  { id: "2", name: "Sepp", amount: 0 },
  { id: "3", name: "Toni", amount: 0 },
  { id: "4", name: "Geri Ranner", amount: 0 },
  { id: "5", name: "Manuel", amount: 0 },
  { id: "6", name: "Rene", amount: 0 },
  { id: "7", name: "Gabi", amount: 0 },
  { id: "8", name: "Roland", amount: 0 },
  { id: "9", name: "Stefan", amount: 0 },
  { id: "10", name: "Richi", amount: 0 }
];

export const saveMockData = (persons) => {
  localStorage.setItem('personAmounts', JSON.stringify(persons));
  return persons;
};

export const loadMockData = () => {
  const saved = localStorage.getItem('personAmounts');
  return saved ? JSON.parse(saved) : mockPersons;
};