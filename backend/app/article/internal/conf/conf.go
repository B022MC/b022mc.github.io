package conf

type Config struct {
	Server struct {
		GRPC struct {
			Addr string `yaml:"addr"`
		} `yaml:"grpc"`
	} `yaml:"server"`
	Data struct {
		Database struct {
			Source string `yaml:"source"`
		} `yaml:"database"`
		Redis struct {
			Addr     string `yaml:"addr"`
			Password string `yaml:"password"`
		} `yaml:"redis"`
	} `yaml:"data"`
}
