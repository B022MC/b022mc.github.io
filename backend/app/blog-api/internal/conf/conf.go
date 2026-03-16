package conf

type Config struct {
	Server struct {
		HTTP struct {
			Addr string `yaml:"addr"`
		} `yaml:"http"`
	} `yaml:"server"`
	Services struct {
		Article struct {
			Addr string `yaml:"addr"`
		} `yaml:"article"`
		User struct {
			Addr string `yaml:"addr"`
		} `yaml:"user"`
		Comment struct {
			Addr string `yaml:"addr"`
		} `yaml:"comment"`
	} `yaml:"services"`
	Auth struct {
		Secret string `yaml:"secret"`
	} `yaml:"auth"`
}
