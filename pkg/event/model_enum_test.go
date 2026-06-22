package event

import "testing"

// Exemplo de teste-base do projeto: cobre lógica pura (sem banco), exercitando
// o enum gerado por go-enum. Use-o como ponto de partida para novos testes.

func TestParseEventTypeOf(t *testing.T) {
	cases := []struct {
		name    string
		input   string
		want    EventTypeOf
		wantErr bool
	}{
		{name: "online", input: "online", want: EventTypeOfOnline},
		{name: "in_person", input: "in_person", want: EventTypeOfInPerson},
		{name: "inválido", input: "telepathy", wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ParseEventTypeOf(tc.input)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("esperava erro para %q, mas não houve", tc.input)
				}
				return
			}
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tc.want {
				t.Fatalf("ParseEventTypeOf(%q) = %v, want %v", tc.input, got, tc.want)
			}
		})
	}
}

func TestEventTypeOfStringRoundTrip(t *testing.T) {
	for _, v := range []EventTypeOf{EventTypeOfOnline, EventTypeOfInPerson} {
		parsed, err := ParseEventTypeOf(v.String())
		if err != nil {
			t.Fatalf("round-trip falhou para %v: %v", v, err)
		}
		if parsed != v {
			t.Fatalf("round-trip: %v -> %q -> %v", v, v.String(), parsed)
		}
	}
}
