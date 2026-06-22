package event

import (
	"context"
	"strings"
	"sync"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// recordingMatcher captures the final SQL string GORM hands to the driver so we
// can assert how user input is embedded. It matches every query (returns nil)
// because we only care about inspecting the generated SQL, not enforcing a
// specific expectation order.
type recordingMatcher struct {
	mu   sync.Mutex
	sqls []string
}

func (m *recordingMatcher) Match(_, actual string) error {
	m.mu.Lock()
	m.sqls = append(m.sqls, actual)
	m.mu.Unlock()
	return nil
}

func (m *recordingMatcher) all() string {
	m.mu.Lock()
	defer m.mu.Unlock()
	return strings.Join(m.sqls, "\n")
}

func newMockedService(t *testing.T) (*EventService, *recordingMatcher, sqlmock.Sqlmock) {
	t.Helper()
	rec := &recordingMatcher{}
	mockDB, mock, err := sqlmock.New(
		sqlmock.QueryMatcherOption(rec),
		sqlmock.MonitorPingsOption(false),
	)
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	t.Cleanup(func() { _ = mockDB.Close() })

	// Any number of queries (main + preloads) may run; return empty rows for all
	// so the call completes without touching a real database.
	mock.MatchExpectationsInOrder(false)
	for i := 0; i < 8; i++ {
		mock.ExpectQuery(".*").WillReturnRows(sqlmock.NewRows([]string{"id"}))
	}

	gdb, err := gorm.Open(postgres.New(postgres.Config{Conn: mockDB}), &gorm.Config{})
	if err != nil {
		t.Fatalf("gorm.Open: %v", err)
	}
	return NewEventService(gdb).(*EventService), rec, mock
}

// TestGet_NameFilterIsParameterized proves the user-supplied `name` filter is
// bound as a query parameter instead of being interpolated into the SQL string.
// Before the fix, the payload below would have appeared verbatim in the SQL.
func TestGet_NameFilterIsParameterized(t *testing.T) {
	svc, rec, _ := newMockedService(t)

	const payload = "x%' OR '1'='1"
	if _, err := svc.Get(context.Background(), payload, "", nil, nil, false, 0, 10); err != nil {
		t.Fatalf("Get returned error: %v", err)
	}

	sql := rec.all()
	if sql == "" {
		t.Fatal("no SQL was captured")
	}
	if strings.Contains(sql, payload) {
		t.Fatalf("injection payload leaked into SQL string (not parameterized):\n%s", sql)
	}
	if !strings.Contains(strings.ToUpper(sql), "TITLE LIKE $") {
		t.Fatalf("expected a parameterized `title LIKE $N` clause, got:\n%s", sql)
	}
}

// TestGet_TypeOfFilterIsParameterized proves the type_of enum values are bound
// as parameters and only the static `::eventtypeof` casts remain in the SQL.
func TestGet_TypeOfFilterIsParameterized(t *testing.T) {
	svc, rec, _ := newMockedService(t)

	typeOf := []EventTypeOf{EventTypeOfOnline, EventTypeOfInPerson}
	if _, err := svc.Get(context.Background(), "", "", nil, typeOf, false, 0, 10); err != nil {
		t.Fatalf("Get returned error: %v", err)
	}

	sql := rec.all()
	if !strings.Contains(sql, "::eventtypeof") {
		t.Fatalf("expected the ::eventtypeof cast to remain in SQL, got:\n%s", sql)
	}
	for _, literal := range []string{"'online'::eventtypeof", "'in_person'::eventtypeof"} {
		if strings.Contains(sql, literal) {
			t.Fatalf("enum value was interpolated as a literal (%s), expected a bound parameter:\n%s", literal, sql)
		}
	}
	if !strings.Contains(sql, "$") {
		t.Fatalf("expected bound parameters in the type_of clause, got:\n%s", sql)
	}
}
