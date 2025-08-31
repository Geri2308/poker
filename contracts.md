# API Contracts & Integration Plan

## Backend API Endpoints

### 1. GET /api/persons
- **Response**: Array of person objects
- **Format**: `[{id, name, amount, createdAt, updatedAt}]`
- **Purpose**: Load all persons with their current amounts

### 2. POST /api/persons
- **Request Body**: `{name: string, amount: number}`
- **Response**: Created person object
- **Purpose**: Create new person (if needed for future expansion)

### 3. PUT /api/persons/:id
- **Request Body**: `{amount: number}`
- **Response**: Updated person object
- **Purpose**: Update person's amount

### 4. PUT /api/persons/bulk
- **Request Body**: `[{id, amount}]`
- **Response**: Array of updated persons
- **Purpose**: Bulk update all amounts (for save functionality)

### 5. POST /api/persons/reset
- **Response**: Array of persons with amounts reset to 0
- **Purpose**: Reset all amounts to 0

## Database Model

```javascript
PersonSchema = {
  id: String (UUID),
  name: String (required),
  amount: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration Changes

### Mock Data Replacement
- Replace `loadMockData()` with API call to `GET /api/persons`
- Replace `saveMockData()` with API call to `PUT /api/persons/bulk`
- Add error handling for API failures
- Add loading states during API calls

### Components Changes
- `App.js`: Replace localStorage with API calls
- `PersonAmountCard.jsx`: No changes needed (props remain same)
- `TotalSummary.jsx`: No changes needed (props remain same)

### Initial Data Setup
Backend will initialize with predefined persons:
- Geri, Sepp, Toni, Geri Ranner, Manuel, Rene, Gabi, Roland, Stefan, Richi

## Error Handling
- Network errors: Show toast notification
- Server errors: Fallback to localStorage as backup
- Loading states: Show spinner while API calls in progress

## Testing Strategy
1. Test all CRUD endpoints with curl
2. Test frontend-backend integration
3. Test error scenarios
4. Verify data persistence across page refreshes