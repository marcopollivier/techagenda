# Build image layer
FROM golang:1.21.5 AS builder
ARG VERSION
ADD . /app
WORKDIR /app
RUN go mod download
ENV CGO_ENABLED=0 GO111MODULE=on GOOS=linux
RUN go build -a -ldflags "-s -w -X 'github.com/marcopollivier/techagenda/lib/config.version=$VERSION'" -o techagenda .

# Release image layer
# TODO: Find a way to send a scratch image to heroko
# FROM scratch
# COPY --from=alpine:latest /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
FROM alpine:latest
COPY --from=builder /app/techagenda /techagenda
COPY --from=builder /app/public /public
CMD ./techagenda
