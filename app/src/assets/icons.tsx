import { Ionicons } from '@expo/vector-icons';

export const icons = {
  index: (props: any) => <Ionicons name={props.isFocused ? "home" : "home-outline"} size={26} {...props} />,
  groups: (props: any) => <Ionicons name={props.isFocused ? "people" : "people-outline"} size={26} {...props} />,
  books: (props: any) => <Ionicons name={props.isFocused ? "library" : "library-outline"} size={26} {...props} />,
  admin: (props: any) => <Ionicons name={props.isFocused ? "shield-checkmark" : "shield-checkmark-outline"} size={26} {...props} />,
  profile: (props: any) => <Ionicons name={props.isFocused ? "person" : "person-outline"} size={26} {...props} />,
};
