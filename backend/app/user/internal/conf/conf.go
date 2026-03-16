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
	} `yaml:"data"`
	Auth struct {
		Secret string `yaml:"secret"`
		Expire int64  `yaml:"expire"`
	} `yaml:"auth"`
}
