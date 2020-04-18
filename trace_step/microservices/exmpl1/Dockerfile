FROM golang:1.14-alpine 

WORKDIR /service

COPY microservices/exmpl1/go.mod go.mod
COPY microservices/exmpl1/go.sum go.sum

COPY golang /golang

RUN go mod download

COPY microservices/exmpl1/ .

RUN go build -ldflags "-X github.com/Strum355/tracestep/golang.GoPath=$GOPATH -X github.com/Strum355/tracestep/golang.GoModulePath=$(pwd)" cmd/*.go

ENTRYPOINT [ "./main" ]