package event

type Service interface {
	Create()
	Read()
	Update()
	Delete()
}
